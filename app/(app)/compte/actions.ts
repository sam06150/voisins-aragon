"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  requireUser,
  requireApproved,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validation";
import { DELETED_EMAIL_PREFIX } from "@/lib/accounts";

export async function updateEmailPref(formData: FormData) {
  const user = await requireApproved();
  await prisma.user.update({
    where: { id: user.id },
    data: { emailNotifications: formData.get("emailNotifications") === "on" },
  });
  revalidatePath("/compte");
  redirect("/compte?prefok=1");
}

export type PasswordFormState = { error?: string; ok?: boolean };

export async function changePassword(
  _prev: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword")?.toString() ?? "",
    newPassword: formData.get("newPassword")?.toString() ?? "",
    confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    return { error: "Mot de passe actuel incorrect." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { ok: true };
}

/**
 * Droit à l'effacement (RGPD) : le locataire supprime lui-même son compte.
 * Les données personnelles et l'accès sont effacés ; les contributions
 * collectives sont anonymisées (les messages privés envoyés sont purgés).
 */
export async function deleteMyAccount() {
  const user = await requireApproved();

  // Garde : ne pas supprimer le dernier administrateur (éviter le verrouillage).
  if (user.role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN", status: { not: "REJECTED" } },
    });
    if (adminCount <= 1) redirect("/compte?delerror=lastadmin");
  }

  const randomHash = await hashPassword(randomUUID());
  await prisma.$transaction([
    prisma.privateMessage.updateMany({
      where: { senderId: user.id },
      data: { body: "[message supprimé]" },
    }),
    prisma.pushSubscription.deleteMany({ where: { userId: user.id } }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: "Compte",
        lastName: "supprimé",
        email: `${DELETED_EMAIL_PREFIX}${user.id}@aragon.local`,
        phone: null,
        passwordHash: randomHash,
        status: "REJECTED",
        role: "TENANT",
        unitId: null,
        shareInDirectory: false,
        shareEmail: false,
        sharePhone: false,
        emailNotifications: false,
        lastSeenAt: null,
        consentAt: null,
      },
    }),
  ]);

  await destroySession();
  redirect("/connexion?deleted=1");
}
