"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaff } from "@/lib/roles";
import {
  scopeFor,
  optionalBuildingScopeWhere,
  assertBuildingInScope,
} from "@/lib/tenancy";
import { petitionSchema } from "@/lib/validation";
import { notifyResidents } from "@/lib/notifications";

export type PetitionFormState = { error?: string };

export async function createPetition(
  _prev: PetitionFormState,
  formData: FormData,
): Promise<PetitionFormState> {
  const user = await requireApproved();

  const parsed = petitionSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    buildingId: formData.get("buildingId")?.toString() ?? "",
    goal: formData.get("goal")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;
  const goal = data.goal ? Number.parseInt(data.goal, 10) : null;

  // Empêche de publier dans la résidence d'un autre en forgeant le buildingId.
  try {
    await assertBuildingInScope(scopeFor(user), data.buildingId || null);
  } catch {
    return { error: "Bâtiment hors de votre résidence." };
  }

  const petition = await prisma.petition.create({
    data: {
      title: data.title,
      description: data.description,
      buildingId: data.buildingId ? data.buildingId : null,
      goal: goal && !Number.isNaN(goal) ? goal : null,
      authorId: user.id,
      // L'auteur signe automatiquement sa pétition.
      signatures: { create: { userId: user.id } },
    },
  });

  await notifyResidents({
    type: "PETITION",
    message: `Nouvelle pétition : « ${data.title} »`,
    link: `/petitions/${petition.id}`,
    buildingId: data.buildingId ? data.buildingId : null,
    residenceId: user.residenceId, // cloisonnement
    excludeUserId: user.id,
  });

  revalidatePath("/petitions");
  redirect(`/petitions/${petition.id}`);
}

export async function signPetition(formData: FormData) {
  const user = await requireApproved();
  const petitionId = formData.get("petitionId")?.toString() ?? "";
  // Commentaire borné (champ libre non passé par un schéma Zod) : on limite la
  // taille stockée/affichée pour éviter tout abus.
  const rawComment = formData.get("comment")?.toString().trim() || "";
  const comment = rawComment ? rawComment.slice(0, 2000) : null;
  if (!petitionId) redirect("/petitions");

  const petition = await prisma.petition.findFirst({
    where: { AND: [optionalBuildingScopeWhere(scopeFor(user)), { id: petitionId }] },
  });
  if (!petition || petition.closed) {
    redirect(`/petitions/${petitionId}`);
  }

  await prisma.petitionSignature.upsert({
    where: { petitionId_userId: { petitionId, userId: user.id } },
    update: { comment },
    create: { petitionId, userId: user.id, comment },
  });

  revalidatePath(`/petitions/${petitionId}`);
  redirect(`/petitions/${petitionId}`);
}

export async function unsignPetition(formData: FormData) {
  const user = await requireApproved();
  const petitionId = formData.get("petitionId")?.toString() ?? "";
  if (!petitionId) redirect("/petitions");

  await prisma.petitionSignature.deleteMany({
    where: { petitionId, userId: user.id },
  });

  revalidatePath(`/petitions/${petitionId}`);
  redirect(`/petitions/${petitionId}`);
}

export async function closePetition(formData: FormData) {
  const user = await requireApproved();
  const petitionId = formData.get("petitionId")?.toString() ?? "";
  const petition = await prisma.petition.findFirst({
    where: { AND: [optionalBuildingScopeWhere(scopeFor(user)), { id: petitionId }] },
  });
  if (!petition) redirect("/petitions");

  // Auteur ou référent uniquement.
  if (petition.authorId !== user.id && !isStaff(user.role)) {
    redirect(`/petitions/${petitionId}`);
  }

  await prisma.petition.update({
    where: { id: petitionId },
    data: { closed: !petition.closed },
  });

  revalidatePath(`/petitions/${petitionId}`);
  redirect(`/petitions/${petitionId}`);
}

/**
 * Relance les locataires qui n'ont PAS encore signé (notification + push).
 * Réservé à l'auteur ou au staff, pétition ouverte, au plus une fois par 24 h.
 */
export async function remindPetition(formData: FormData) {
  const user = await requireApproved();
  const petitionId = formData.get("petitionId")?.toString() ?? "";
  const petition = await prisma.petition.findFirst({
    where: { AND: [optionalBuildingScopeWhere(scopeFor(user)), { id: petitionId }] },
    include: { signatures: { select: { userId: true } } },
  });
  if (!petition || petition.closed) redirect(`/petitions/${petitionId}`);
  if (petition.authorId !== user.id && !isStaff(user.role)) {
    redirect(`/petitions/${petitionId}`);
  }

  // Anti-spam : une relance par 24 h maximum.
  const DAY_MS = 24 * 60 * 60 * 1000;
  if (
    petition.lastRemindedAt &&
    Date.now() - petition.lastRemindedAt.getTime() < DAY_MS
  ) {
    redirect(`/petitions/${petitionId}?error=reminded`);
  }

  await prisma.petition.update({
    where: { id: petitionId },
    data: { lastRemindedAt: new Date() },
  });

  await notifyResidents({
    type: "PETITION",
    message: `Rappel — pétition à signer : « ${petition.title} »`,
    link: `/petitions/${petition.id}`,
    buildingId: petition.buildingId,
    residenceId: user.residenceId, // cloisonnement
    excludeUserIds: petition.signatures.map((s) => s.userId), // déjà signé
  });

  revalidatePath(`/petitions/${petitionId}`);
  redirect(`/petitions/${petitionId}?ok=reminded`);
}

/** Supprime une pétition (auteur ou staff). Signatures supprimées en cascade. */
export async function deletePetition(formData: FormData) {
  const user = await requireApproved();
  const petitionId = formData.get("petitionId")?.toString() ?? "";
  if (!petitionId) redirect("/petitions");

  const petition = await prisma.petition.findFirst({
    where: { AND: [optionalBuildingScopeWhere(scopeFor(user)), { id: petitionId }] },
  });
  if (!petition) redirect("/petitions");

  if (petition.authorId !== user.id && !isStaff(user.role)) {
    redirect(`/petitions/${petitionId}?error=forbidden`);
  }

  await prisma.petition.delete({ where: { id: petitionId } });

  revalidatePath("/petitions");
  redirect("/petitions");
}
