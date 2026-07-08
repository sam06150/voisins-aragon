"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

/** Envoie une notification de test à soi-même (in-app + push si activé). */
export async function sendTestNotification() {
  const user = await requireApproved();
  await notifyUser({
    userId: user.id,
    type: "SYSTEME",
    message: "🔔 Test — vos notifications fonctionnent !",
    link: "/notifications",
  });
  revalidatePath("/notifications");
  redirect("/notifications");
}

export async function markAllRead() {
  const user = await requireApproved();
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/accueil");
  redirect("/notifications");
}

/** Marque une notification lue puis redirige vers sa cible. */
export async function openNotification(formData: FormData) {
  const user = await requireApproved();
  const id = formData.get("notificationId")?.toString() ?? "";
  const link = formData.get("link")?.toString() || "/notifications";

  if (id) {
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });
  }
  redirect(link);
}
