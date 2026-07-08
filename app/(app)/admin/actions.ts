"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  requireAdmin,
  requireManager,
  requireStaff,
  hashPassword,
} from "@/lib/auth";
import { rank } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { adminResetPasswordSchema, promoteSchema } from "@/lib/validation";
import { sendEmail, emailLayout } from "@/lib/email";
import { DELETED_EMAIL_PREFIX } from "@/lib/accounts";
import { geocodeAddress } from "@/lib/geocode";
import { setSetting } from "@/lib/settings";

/**
 * "Supprime" un compte : efface les données personnelles et coupe l'accès,
 * tout en conservant les contributions (anonymisées) dans l'historique du
 * collectif. On ne peut supprimer qu'un compte de rôle strictement inférieur.
 */
export async function deleteUser(formData: FormData) {
  const actor = await requireStaff();
  const userId = formData.get("userId")?.toString() ?? "";
  if (!userId || userId === actor.id) {
    redirect("/admin/comptes?delerror=self");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) redirect("/admin/comptes");

  if (rank(actor.role) <= rank(target.role)) {
    redirect("/admin/comptes?delerror=rank");
  }

  const randomHash = await hashPassword(randomUUID());
  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: "Compte",
      lastName: "supprimé",
      email: `${DELETED_EMAIL_PREFIX}${userId}@aragon.local`,
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
    },
  });

  revalidatePath("/admin/comptes");
  revalidatePath("/annuaire");
  redirect("/admin/comptes?delok=1");
}

/**
 * Met un compte "en veille" : l'accès est suspendu mais le compte et ses
 * données sont conservés (réversible). On ne peut suspendre qu'un compte de
 * rôle strictement inférieur.
 */
export async function suspendUser(formData: FormData) {
  const actor = await requireStaff();
  const userId = formData.get("userId")?.toString() ?? "";
  if (!userId || userId === actor.id) {
    redirect("/admin/comptes?suerror=self");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) redirect("/admin/comptes");

  if (rank(actor.role) <= rank(target.role)) {
    redirect("/admin/comptes?suerror=rank");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED", lastSeenAt: null },
  });

  revalidatePath("/admin/comptes");
  revalidatePath("/annuaire");
  redirect("/admin/comptes?suok=1");
}

/** Réactive un compte en veille (repasse en "approuvé"). */
export async function reactivateUser(formData: FormData) {
  const actor = await requireStaff();
  const userId = formData.get("userId")?.toString() ?? "";
  if (!userId) redirect("/admin/comptes");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) redirect("/admin/comptes");

  if (rank(actor.role) <= rank(target.role)) {
    redirect("/admin/comptes?suerror=rank");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "APPROVED" },
  });

  revalidatePath("/admin/comptes");
  revalidatePath("/annuaire");
  redirect("/admin/comptes?suok=1");
}

export async function approveAccount(formData: FormData) {
  await requireManager();

  const userId = formData.get("userId")?.toString() ?? "";
  const action = formData.get("action")?.toString() ?? "";
  if (!userId) redirect("/admin/comptes");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/admin/comptes");

  if (action === "reject") {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "REJECTED" },
    });
    revalidatePath("/admin/comptes");
    redirect("/admin/comptes");
  }

  // Approbation : on résout (ou crée) l'unité de logement.
  let unitId = formData.get("unitId")?.toString() || "";
  const newLabel = formData.get("newUnitLabel")?.toString().trim() || "";
  const newFloorRaw = formData.get("newFloor")?.toString().trim() || "";

  if (!unitId && newLabel && user.signupBuildingId) {
    const floor = Number.parseInt(newFloorRaw, 10);
    const existing = await prisma.unit.findFirst({
      where: { buildingId: user.signupBuildingId, label: newLabel },
    });
    if (existing) {
      unitId = existing.id;
    } else {
      const created = await prisma.unit.create({
        data: {
          buildingId: user.signupBuildingId,
          floor: Number.isNaN(floor) ? 0 : floor,
          label: newLabel,
        },
      });
      unitId = created.id;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "APPROVED",
      ...(unitId ? { unitId } : {}),
    },
  });

  await sendEmail({
    to: user.email,
    subject: "Votre compte a été validé",
    html: emailLayout(
      "Bienvenue dans le collectif !",
      `<p>Bonjour ${user.firstName},</p><p>Votre compte sur la plateforme des Voisins Collectif et en Colère a été validé par un référent. Vous pouvez désormais vous connecter et participer.</p>`,
    ),
  });

  revalidatePath("/admin/comptes");
  revalidatePath("/annuaire");
  redirect("/admin/comptes");
}

export async function resetUserPassword(formData: FormData) {
  const admin = await requireManager();

  const parsed = adminResetPasswordSchema.safeParse({
    userId: formData.get("userId")?.toString() ?? "",
    newPassword: formData.get("newPassword")?.toString() ?? "",
  });
  if (!parsed.success) {
    redirect("/admin/comptes?pwerror=1");
  }

  // Un référent ne réinitialise pas son propre mot de passe ici (utiliser /compte).
  if (parsed.data.userId === admin.id) {
    redirect("/admin/comptes?pwerror=self");
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { passwordHash },
  });

  revalidatePath("/admin/comptes");
  redirect("/admin/comptes?pwok=1");
}

export async function setUserRole(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = promoteSchema.safeParse({
    userId: formData.get("userId")?.toString() ?? "",
    role: formData.get("role")?.toString() ?? "",
  });
  if (!parsed.success) redirect("/admin/comptes");

  // On ne peut pas se rétrograder soi-même (éviter de se verrouiller dehors).
  if (parsed.data.userId === admin.id && parsed.data.role !== "ADMIN") {
    redirect("/admin/comptes?roleerror=self");
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });

  revalidatePath("/admin/comptes");
  redirect("/admin/comptes?roleok=1");
}

export async function createUnit(formData: FormData) {
  await requireManager();

  const buildingId = formData.get("buildingId")?.toString() ?? "";
  const label = formData.get("label")?.toString().trim() ?? "";
  const floorRaw = formData.get("floor")?.toString().trim() ?? "";
  const floor = Number.parseInt(floorRaw, 10);

  if (!buildingId || !label) {
    redirect("/admin/immeubles?error=1");
  }

  const existing = await prisma.unit.findFirst({
    where: { buildingId, label },
  });
  if (!existing) {
    await prisma.unit.create({
      data: { buildingId, label, floor: Number.isNaN(floor) ? 0 : floor },
    });
  }

  revalidatePath("/admin/immeubles");
  redirect("/admin/immeubles?ok=1");
}

/** Crée un nouveau bâtiment ; géocode l'adresse pour la carte si fournie. */
export async function createBuilding(formData: FormData) {
  await requireManager();
  const name = formData.get("name")?.toString().trim() ?? "";
  const code = formData.get("code")?.toString().trim().toUpperCase() ?? "";
  const address = formData.get("address")?.toString().trim() || null;
  if (!name || !code) redirect("/admin/immeubles?berror=champs");

  const exists = await prisma.building.findFirst({
    where: { OR: [{ code }, { name }] },
  });
  if (exists) redirect("/admin/immeubles?berror=exists");

  const coords = address ? await geocodeAddress(address) : null;
  await prisma.building.create({
    data: {
      name,
      code,
      address,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    },
  });

  revalidatePath("/admin/immeubles");
  revalidatePath("/carte");
  redirect(
    address && !coords
      ? "/admin/immeubles?bwarn=geo"
      : "/admin/immeubles?bok=1",
  );
}

/** Met à jour l'adresse d'un bâtiment et re-géocode ses coordonnées. */
export async function updateBuildingLocation(formData: FormData) {
  await requireManager();
  const id = formData.get("buildingId")?.toString() ?? "";
  const address = formData.get("address")?.toString().trim() || null;
  if (!id) redirect("/admin/immeubles");

  const coords = address ? await geocodeAddress(address) : null;
  await prisma.building.update({
    where: { id },
    data: {
      address,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    },
  });

  revalidatePath("/admin/immeubles");
  revalidatePath("/carte");
  redirect(
    address && !coords
      ? "/admin/immeubles?bwarn=geo"
      : "/admin/immeubles?bok=1",
  );
}

/** Enregistre le nom de la résidence (affiché dans l'app). */
export async function setResidenceName(formData: FormData) {
  await requireManager();
  const name = formData.get("residenceName")?.toString().trim() ?? "";
  await setSetting("residence_name", name);
  revalidatePath("/", "layout");
  redirect("/admin/immeubles?rok=1");
}
