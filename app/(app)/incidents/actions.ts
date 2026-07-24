"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, requireApproved } from "@/lib/auth";
import { isStaff } from "@/lib/roles";
import { prisma } from "@/lib/db";
import {
  scopeFor,
  buildingScopeWhere,
  assertBuildingInScope,
} from "@/lib/tenancy";
import { incidentSchema, incidentStatusSchema } from "@/lib/validation";
import { ALLOWED_MIME, deleteStoredFile, saveUploadedFile } from "@/lib/storage";

const MAX_SIZE = 10 * 1024 * 1024;

export type IncidentFormState = { error?: string };

export async function createIncident(
  _prev: IncidentFormState,
  formData: FormData,
): Promise<IncidentFormState> {
  const user = await requireApproved();

  const parsed = incidentSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    category: formData.get("category")?.toString() ?? "",
    buildingId: formData.get("buildingId")?.toString() ?? "",
    unitId: formData.get("unitId")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;

  const building = await prisma.building.findUnique({
    where: { id: data.buildingId },
  });
  if (!building) return { error: "Bâtiment inconnu." };
  // Empêche de signaler dans la résidence d'un autre en forgeant le buildingId.
  try {
    await assertBuildingInScope(scopeFor(user), data.buildingId);
  } catch {
    return { error: "Bâtiment hors de votre résidence." };
  }

  // Pré-validation des photos avant toute écriture en base.
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  for (const f of files) {
    if (!ALLOWED_MIME[f.type]) {
      return { error: `Photo « ${f.name} » : format non autorisé (JPEG, PNG, WEBP, PDF).` };
    }
    if (f.size > MAX_SIZE) {
      return { error: `Photo « ${f.name} » : trop volumineuse (10 Mo max).` };
    }
  }

  const anonymous = formData.get("anonymous")?.toString() === "on";

  const incident = await prisma.incidentReport.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      buildingId: data.buildingId,
      unitId: data.unitId ? data.unitId : null,
      authorId: user.id,
      anonymous,
    },
  });

  // Si l'enregistrement d'une photo échoue (Cloudinary, disque…), on annule
  // tout : on supprime les fichiers déjà écrits puis l'incident (pas d'orphelin).
  try {
    for (const file of files) {
      const filePath = await saveUploadedFile(file, `incidents/${incident.id}`);
      await prisma.incidentPhoto.create({
        data: { incidentId: incident.id, filePath, uploadedById: user.id },
      });
    }
  } catch {
    const created = await prisma.incidentPhoto.findMany({
      where: { incidentId: incident.id },
    });
    for (const p of created) await deleteStoredFile(p.filePath);
    await prisma.incidentReport
      .delete({ where: { id: incident.id } })
      .catch(() => {});
    return {
      error: "L'enregistrement des photos a échoué. Réessayez.",
    };
  }

  revalidatePath("/incidents");
  redirect(`/incidents/${incident.id}`);
}

export async function toggleSupport(formData: FormData) {
  const user = await requireApproved();
  const incidentId = formData.get("incidentId")?.toString() ?? "";
  if (!incidentId) redirect("/incidents");

  // On ne soutient qu'un signalement de sa propre résidence.
  const inScope = await prisma.incidentReport.findFirst({
    where: { AND: [buildingScopeWhere(scopeFor(user)), { id: incidentId }] },
    select: { id: true },
  });
  if (!inScope) redirect("/incidents");

  const existing = await prisma.incidentSupport.findUnique({
    where: { incidentId_userId: { incidentId, userId: user.id } },
  });

  if (existing) {
    await prisma.incidentSupport
      .delete({ where: { id: existing.id } })
      .catch(() => {});
  } else {
    try {
      await prisma.incidentSupport.create({
        data: { incidentId, userId: user.id },
      });
    } catch (e) {
      // P2002 = déjà soutenu (double-clic / double-soumission) : on ignore.
      if ((e as { code?: string })?.code !== "P2002") throw e;
    }
  }

  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath("/incidents");
  redirect(`/incidents/${incidentId}`);
}

export async function updateIncidentStatus(formData: FormData) {
  const staff = await requireStaff();

  const incidentId = formData.get("incidentId")?.toString() ?? "";
  const parsed = incidentStatusSchema.safeParse({
    status: formData.get("status")?.toString() ?? "",
  });
  if (!incidentId || !parsed.success) {
    redirect(`/incidents/${incidentId}?error=1`);
  }

  // Un modérateur ne modère que les signalements de sa résidence.
  const inScope = await prisma.incidentReport.findFirst({
    where: { AND: [buildingScopeWhere(scopeFor(staff)), { id: incidentId }] },
    select: { id: true },
  });
  if (!inScope) redirect("/incidents");

  await prisma.incidentReport.update({
    where: { id: incidentId },
    data: { status: parsed.data.status },
  });

  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath("/incidents");
  redirect(`/incidents/${incidentId}?ok=1`);
}

/**
 * Supprime un signalement (et ses photos). Réservé à l'auteur ou au staff.
 * Les photos et soutiens liés sont supprimés en cascade (voir schéma).
 */
export async function deleteIncident(formData: FormData) {
  const user = await requireApproved();
  const incidentId = formData.get("incidentId")?.toString() ?? "";
  if (!incidentId) redirect("/incidents");

  const incident = await prisma.incidentReport.findFirst({
    // borné à la résidence de l'utilisateur
    where: { AND: [buildingScopeWhere(scopeFor(user)), { id: incidentId }] },
    include: { photos: true },
  });
  if (!incident) redirect("/incidents");

  // Seuls l'auteur ou un membre du staff (modérateur/sous-admin/admin) peuvent supprimer.
  if (incident.authorId !== user.id && !isStaff(user.role)) {
    redirect(`/incidents/${incidentId}?error=forbidden`);
  }

  // Nettoyage des fichiers (Cloudinary ou disque local), best effort.
  for (const photo of incident.photos) {
    await deleteStoredFile(photo.filePath);
  }

  await prisma.incidentReport.delete({ where: { id: incidentId } });

  revalidatePath("/incidents");
  redirect("/incidents");
}
