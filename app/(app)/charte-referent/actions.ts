"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Enregistre l'acceptation de la charte du référent par le membre du staff
 * lui-même (consentement horodaté). Débloque ensuite l'espace d'administration.
 */
export async function acceptModeratorCharter(formData: FormData) {
  const user = await requireStaff();

  // La case doit être cochée : sinon on renvoie sur la page avec une erreur.
  if (formData.get("accept") !== "on") {
    redirect("/charte-referent?error=1");
  }

  // Idempotent : on ne réécrit pas la date si elle existe déjà.
  if (!user.moderatorCharterAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { moderatorCharterAt: new Date() },
    });
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}
