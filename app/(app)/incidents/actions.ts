"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, requireApproved } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { incidentSchema, incidentStatusSchema } from "@/lib/validation";
import { ALLOWED_MIME, saveUploadedFile } from "@/lib/storage";

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

  const incident = await prisma.incidentReport.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      buildingId: data.buildingId,
      unitId: data.unitId ? data.unitId : null,
      authorId: user.id,
    },
  });

  for (const file of files) {
    const filePath = await saveUploadedFile(file, `incidents/${incident.id}`);
    await prisma.incidentPhoto.create({
      data: { incidentId: incident.id, filePath, uploadedById: user.id },
    });
  }

  revalidatePath("/incidents");
  redirect(`/incidents/${incident.id}`);
}

export async function toggleSupport(formData: FormData) {
  const user = await requireApproved();
  const incidentId = formData.get("incidentId")?.toString() ?? "";
  if (!incidentId) redirect("/incidents");

  const existing = await prisma.incidentSupport.findUnique({
    where: { incidentId_userId: { incidentId, userId: user.id } },
  });

  if (existing) {
    await prisma.incidentSupport.delete({ where: { id: existing.id } });
  } else {
    await prisma.incidentSupport.create({
      data: { incidentId, userId: user.id },
    });
  }

  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath("/incidents");
  redirect(`/incidents/${incidentId}`);
}

export async function updateIncidentStatus(formData: FormData) {
  await requireStaff();

  const incidentId = formData.get("incidentId")?.toString() ?? "";
  const parsed = incidentStatusSchema.safeParse({
    status: formData.get("status")?.toString() ?? "",
  });
  if (!incidentId || !parsed.success) {
    redirect(`/incidents/${incidentId}?error=1`);
  }

  await prisma.incidentReport.update({
    where: { id: incidentId },
    data: { status: parsed.data.status },
  });

  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath("/incidents");
  redirect(`/incidents/${incidentId}?ok=1`);
}
