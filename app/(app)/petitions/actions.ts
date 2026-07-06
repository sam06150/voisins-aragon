"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaff } from "@/lib/roles";
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
    excludeUserId: user.id,
  });

  revalidatePath("/petitions");
  redirect(`/petitions/${petition.id}`);
}

export async function signPetition(formData: FormData) {
  const user = await requireApproved();
  const petitionId = formData.get("petitionId")?.toString() ?? "";
  const comment = formData.get("comment")?.toString().trim() || null;
  if (!petitionId) redirect("/petitions");

  const petition = await prisma.petition.findUnique({
    where: { id: petitionId },
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
  const petition = await prisma.petition.findUnique({
    where: { id: petitionId },
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
