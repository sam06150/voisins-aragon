"use server";

import { randomUUID } from "crypto";
import type { Role, User } from "@prisma/client";
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
import {
  adminResetPasswordSchema,
  adminUpdateUserSchema,
  joinRequestStatusSchema,
  promoteSchema,
} from "@/lib/validation";
import { sendEmail, emailLayout, escapeHtml } from "@/lib/email";
import { DELETED_EMAIL_PREFIX } from "@/lib/accounts";
import { geocodeAddress } from "@/lib/geocode";
import { setSetting } from "@/lib/settings";
import { logAudit } from "@/lib/audit";

/**
 * Charge le compte cible et vérifie que l'acteur peut agir dessus (rôle
 * strictement supérieur). Redirige (message d'erreur) si le compte n'existe
 * pas ou si le rang est insuffisant ; renvoie sinon la cible.
 */
async function assertCanActOn(
  actor: { id: string; role: Role },
  userId: string,
  rankErrorPath: string,
): Promise<User> {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) redirect("/admin/comptes");
  if (rank(actor.role) <= rank(target.role)) redirect(rankErrorPath);
  return target;
}

/**
 * "Supprime" un compte : efface les données personnelles et coupe l'accès,
 * tout en conservant les contributions (anonymisées) dans l'historique du
 * collectif. On ne peut supprimer qu'un compte de rôle strictement inférieur.
 */
export async function deleteUser(formData: FormData) {
  const actor = await requireManager();
  const userId = formData.get("userId")?.toString() ?? "";
  if (!userId || userId === actor.id) {
    redirect("/admin/comptes?delerror=self");
  }

  const target = await assertCanActOn(actor, userId, "/admin/comptes?delerror=rank");

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

  await logAudit(actor, "account.delete", {
    target: `${target.firstName} ${target.lastName}`,
    detail: "Compte anonymisé et accès coupé.",
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
  const actor = await requireManager();
  const userId = formData.get("userId")?.toString() ?? "";
  if (!userId || userId === actor.id) {
    redirect("/admin/comptes?suerror=self");
  }

  const target = await assertCanActOn(actor, userId, "/admin/comptes?suerror=rank");

  await prisma.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED", lastSeenAt: null },
  });

  await logAudit(actor, "account.suspend", {
    target: `${target.firstName} ${target.lastName}`,
  });

  revalidatePath("/admin/comptes");
  revalidatePath("/annuaire");
  redirect("/admin/comptes?suok=1");
}

/** Réactive un compte en veille (repasse en "approuvé"). */
export async function reactivateUser(formData: FormData) {
  const actor = await requireManager();
  const userId = formData.get("userId")?.toString() ?? "";
  if (!userId) redirect("/admin/comptes");

  const target = await assertCanActOn(actor, userId, "/admin/comptes?suerror=rank");

  await prisma.user.update({
    where: { id: userId },
    data: { status: "APPROVED" },
  });

  await logAudit(actor, "account.reactivate", {
    target: `${target.firstName} ${target.lastName}`,
  });

  revalidatePath("/admin/comptes");
  revalidatePath("/annuaire");
  redirect("/admin/comptes?suok=1");
}

/** Résout (ou crée) une résidence par son nom. Renvoie null si nom vide. */
async function resolveResidenceId(name: string): Promise<string | null> {
  if (!name) return null;
  const existing = await prisma.residence.findFirst({ where: { name } });
  return existing
    ? existing.id
    : (await prisma.residence.create({ data: { name } })).id;
}

/** Réutilise un bâtiment de même code ou nom s'il existe, sinon le crée. */
async function findOrCreateBuilding(
  name: string,
  code: string,
  residenceId: string | null,
): Promise<string> {
  const existing = await prisma.building.findFirst({
    where: { OR: [{ code }, { name }] },
  });
  return existing
    ? existing.id
    : (await prisma.building.create({ data: { name, code, residenceId } })).id;
}

/** Réutilise un logement (bâtiment + libellé) s'il existe, sinon le crée. */
async function findOrCreateUnit(
  buildingId: string,
  label: string,
  floorRaw: string,
): Promise<string> {
  const existing = await prisma.unit.findFirst({
    where: { buildingId, label },
  });
  if (existing) return existing.id;
  const floor = Number.parseInt(floorRaw, 10);
  return (
    await prisma.unit.create({
      data: { buildingId, floor: Number.isNaN(floor) ? 0 : floor, label },
    })
  ).id;
}

export async function approveAccount(formData: FormData) {
  const actor = await requireManager();

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
    await logAudit(actor, "account.reject", {
      target: `${user.firstName} ${user.lastName}`,
    });
    revalidatePath("/admin/comptes");
    redirect("/admin/comptes");
  }

  // Bâtiment cible : sélection existante, sinon création à la volée (le référent
  // peut créer le bâtiment — et sa résidence — sans passer par « Immeubles »),
  // sinon celui déclaré à l'inscription.
  let targetBuildingId = formData.get("buildingId")?.toString() || "";
  const newBuildingName = formData.get("newBuildingName")?.toString().trim() || "";
  const newBuildingCode =
    formData.get("newBuildingCode")?.toString().trim().toUpperCase() || "";
  const newResidenceName =
    formData.get("newResidenceName")?.toString().trim() || "";

  // Un nom de bâtiment sans code ne peut pas créer le bâtiment (code unique
  // obligatoire). On alerte le référent plutôt que de valider sans logement.
  if (newBuildingName && !newBuildingCode) {
    redirect("/admin/comptes?error=code");
  }

  let unitId = formData.get("unitId")?.toString() || "";
  const newLabel = formData.get("newUnitLabel")?.toString().trim() || "";
  const newFloorRaw = formData.get("newFloor")?.toString().trim() || "";

  // Création en cascade (résidence → bâtiment → unité). Les contraintes uniques
  // (nom résidence, code/nom bâtiment, logement) peuvent lever P2002 en cas de
  // double validation simultanée : on capture proprement (pas de redirect ici,
  // sinon Next l'interpréterait comme une erreur avalée par le catch).
  let conflict = false;
  try {
    if (!targetBuildingId && newBuildingName && newBuildingCode) {
      const residenceId = await resolveResidenceId(newResidenceName);
      targetBuildingId = await findOrCreateBuilding(
        newBuildingName,
        newBuildingCode,
        residenceId,
      );
    }

    if (!targetBuildingId) targetBuildingId = user.signupBuildingId || "";

    if (!unitId && newLabel && targetBuildingId) {
      unitId = await findOrCreateUnit(targetBuildingId, newLabel, newFloorRaw);
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") conflict = true;
    else throw e;
  }
  if (conflict) redirect("/admin/comptes?error=dup");

  // Si une unité précise est fournie, on vérifie qu'elle existe.
  if (unitId) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) redirect("/admin/comptes?error=unit");
  }

  // Cloisonnement : on rattache le compte à la résidence de son bâtiment.
  // (Le référent a résolu le bâtiment juste au-dessus.) residenceId peut rester
  // null si le bâtiment n'appartient à aucune résidence (déploiement historique).
  let residenceId: string | null = null;
  if (targetBuildingId) {
    const b = await prisma.building.findUnique({
      where: { id: targetBuildingId },
      select: { residenceId: true },
    });
    residenceId = b?.residenceId ?? null;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "APPROVED",
      ...(unitId ? { unitId } : {}),
      ...(residenceId ? { residenceId } : {}),
    },
  });

  await sendEmail({
    to: user.email,
    subject: "Votre compte a été validé",
    html: emailLayout(
      "Bienvenue dans le collectif !",
      `<p>Bonjour ${escapeHtml(user.firstName)},</p><p>Votre compte sur la plateforme des Voisins Collectif et en Colère a été validé par un référent. Vous pouvez désormais vous connecter et participer.</p>`,
    ),
  });

  await logAudit(actor, "account.approve", {
    target: `${user.firstName} ${user.lastName}`,
  });

  revalidatePath("/admin/comptes");
  revalidatePath("/annuaire");
  redirect("/admin/comptes");
}

/**
 * Édite la fiche d'un voisin (identité, contact, statut, logement). Réservé aux
 * administrateurs, et uniquement sur un compte de rôle strictement inférieur.
 * Les préférences d'annuaire ne sont volontairement pas modifiables ici : ce
 * sont des consentements que seul l'intéressé peut donner ou retirer (RGPD).
 */
export async function updateUser(formData: FormData) {
  const actor = await requireAdmin();

  const parsed = adminUpdateUserSchema.safeParse({
    userId: formData.get("userId")?.toString() ?? "",
    firstName: formData.get("firstName")?.toString() ?? "",
    lastName: formData.get("lastName")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    status: formData.get("status")?.toString() ?? "",
    unitId: formData.get("unitId")?.toString() ?? "",
    newBuildingId: formData.get("newBuildingId")?.toString() ?? "",
    newFloor: formData.get("newFloor")?.toString() ?? "",
    newUnitLabel: formData.get("newUnitLabel")?.toString() ?? "",
  });
  if (!parsed.success) redirect("/admin/comptes?editerror=champs");

  const d = parsed.data;
  const back = `/admin/comptes/${d.userId}`;

  await assertCanActOn(actor, d.userId, `${back}?editerror=rank`);

  // L'e-mail sert d'identifiant de connexion : il doit rester unique.
  const clash = await prisma.user.findFirst({
    where: { email: d.email, id: { not: d.userId } },
    select: { id: true },
  });
  if (clash) redirect(`${back}?editerror=email`);

  // Logement : soit un existant est choisi, soit on en crée un dans le
  // bâtiment indiqué, soit on détache le compte ("" = sans logement).
  let unitId: string | null = d.unitId || null;
  if (!unitId && d.newBuildingId && d.newUnitLabel) {
    unitId = await findOrCreateUnit(
      d.newBuildingId,
      d.newUnitLabel,
      d.newFloor ?? "",
    );
  } else if (unitId) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) redirect(`${back}?editerror=unit`);
  }

  // Cloisonnement : la résidence suit le logement rattaché (via son bâtiment).
  // Sans logement, on ne modifie pas le rattachement existant.
  let residenceUpdate: { residenceId: string | null } | Record<string, never> =
    {};
  if (unitId) {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { building: { select: { residenceId: true } } },
    });
    residenceUpdate = { residenceId: unit?.building.residenceId ?? null };
  }

  await prisma.user.update({
    where: { id: d.userId },
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone || null,
      status: d.status,
      unitId,
      ...residenceUpdate,
      // Un compte suspendu ne doit plus apparaître "en ligne".
      ...(d.status === "SUSPENDED" ? { lastSeenAt: null } : {}),
    },
  });

  revalidatePath("/admin/comptes");
  revalidatePath(back);
  revalidatePath("/annuaire");
  redirect(`${back}?editok=1`);
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

  // On ne peut réinitialiser que le mot de passe d'un compte de rôle
  // strictement inférieur (sinon un sous-admin prendrait la main sur un admin).
  await assertCanActOn(admin, parsed.data.userId, "/admin/comptes?pwerror=rank");

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const pwTarget = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { passwordHash },
  });

  await logAudit(admin, "account.password_reset", {
    target: `${pwTarget.firstName} ${pwTarget.lastName}`,
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

  const roleTarget = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });

  await logAudit(admin, "account.role", {
    target: `${roleTarget.firstName} ${roleTarget.lastName}`,
    detail: `Nouveau rôle : ${parsed.data.role}`,
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
  const residenceId = formData.get("residenceId")?.toString() || null;
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
      residenceId: residenceId || null,
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

/** Crée une nouvelle résidence (groupe de bâtiments) ; géocode l'adresse si fournie. */
export async function createResidence(formData: FormData) {
  await requireManager();
  const name = formData.get("name")?.toString().trim() ?? "";
  const address = formData.get("address")?.toString().trim() || null;
  if (!name) redirect("/admin/immeubles?rerror=champs");

  const exists = await prisma.residence.findFirst({ where: { name } });
  if (exists) redirect("/admin/immeubles?rerror=exists");

  const coords = address ? await geocodeAddress(address) : null;
  await prisma.residence.create({
    data: {
      name,
      address,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    },
  });

  revalidatePath("/admin/immeubles");
  revalidatePath("/carte");
  redirect("/admin/immeubles?resok=1");
}

/** Rattache un bâtiment à une résidence (ou l'en détache si vide). */
export async function assignBuildingResidence(formData: FormData) {
  await requireManager();
  const buildingId = formData.get("buildingId")?.toString() ?? "";
  const residenceId = formData.get("residenceId")?.toString() || null;
  if (!buildingId) redirect("/admin/immeubles");

  await prisma.building.update({
    where: { id: buildingId },
    data: { residenceId: residenceId || null },
  });

  revalidatePath("/admin/immeubles");
  revalidatePath("/carte");
  redirect("/admin/immeubles?bok=1");
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

/** Enregistre l'emplacement précis d'un bâtiment (coordonnées choisies sur la carte). */
export async function saveBuildingCoords(formData: FormData) {
  await requireManager();
  const id = formData.get("buildingId")?.toString() ?? "";
  const address = formData.get("address")?.toString().trim() || null;
  const lat = Number.parseFloat(formData.get("latitude")?.toString() ?? "");
  const lng = Number.parseFloat(formData.get("longitude")?.toString() ?? "");
  if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    redirect("/admin/immeubles?berror=champs");
  }

  await prisma.building.update({
    where: { id },
    data: { address, latitude: lat, longitude: lng },
  });

  revalidatePath("/admin/immeubles");
  revalidatePath("/carte");
  redirect("/admin/immeubles?bok=1");
}

/** Enregistre le nom de la résidence (affiché dans l'app). */
export async function setResidenceName(formData: FormData) {
  await requireManager();
  const name = formData.get("residenceName")?.toString().trim() ?? "";
  await setSetting("residence_name", name);
  revalidatePath("/", "layout");
  redirect("/admin/immeubles?rok=1");
}

/**
 * Traite une candidature publique (page /rejoindre ou /referent) : changement
 * de statut + note interne. La candidature n'est PAS un compte : accepter une
 * candidature de référent signifie qu'on a contacté la personne et qu'on va
 * lui créer un accès, pas qu'un accès est créé automatiquement.
 */
export async function updateJoinRequest(formData: FormData) {
  await requireStaff();
  const parsed = joinRequestStatusSchema.safeParse({
    id: formData.get("id")?.toString() ?? "",
    status: formData.get("status")?.toString() ?? "",
    handledNote: formData.get("handledNote")?.toString() ?? "",
  });
  if (!parsed.success) {
    redirect("/admin/candidatures?cerror=1");
  }

  await prisma.joinRequest.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      handledNote: parsed.data.handledNote || null,
    },
  });

  revalidatePath("/admin/candidatures");
  redirect("/admin/candidatures?cok=1");
}
