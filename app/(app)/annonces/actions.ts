"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { announcementSchema } from "@/lib/validation";
import { notifyResidents } from "@/lib/notifications";

export type AnnouncementFormState = { error?: string };

export async function createAnnouncement(
  _prev: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  const admin = await requireManager();

  const parsed = announcementSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    body: formData.get("body")?.toString() ?? "",
    buildingId: formData.get("buildingId")?.toString() ?? "",
    pinned: formData.get("pinned") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;

  const announcement = await prisma.announcement.create({
    data: {
      title: data.title,
      body: data.body,
      buildingId: data.buildingId ? data.buildingId : null,
      pinned: data.pinned ?? false,
      authorId: admin.id,
    },
  });

  await notifyResidents({
    type: "ANNONCE",
    message: `Nouvelle annonce : « ${data.title} »`,
    detail: data.body,
    link: "/annonces",
    buildingId: data.buildingId ? data.buildingId : null,
    excludeUserId: admin.id,
    email: true,
  });
  void announcement;

  revalidatePath("/annonces");
  revalidatePath("/accueil");
  redirect("/annonces");
}

export async function deleteAnnouncement(formData: FormData) {
  await requireManager();
  const id = formData.get("announcementId")?.toString() ?? "";
  if (id) {
    await prisma.announcement.delete({ where: { id } });
  }
  revalidatePath("/annonces");
  revalidatePath("/accueil");
  redirect("/annonces");
}
