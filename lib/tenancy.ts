import { prisma } from "./db";

/**
 * Cloisonnement multi-résidences.
 *
 * Historique : la plateforme a été construite pour UNE résidence. Tous les
 * comptes existants ont `residenceId = null` et voient tout — c'est le
 * comportement mono-résidence, préservé tel quel.
 *
 * Ouverture : dès qu'un compte est rattaché à une résidence (`residenceId`
 * renseigné), il ne doit voir QUE les données rattachées aux bâtiments de
 * cette résidence. C'est une exigence RGPD (minimisation) autant que de
 * confiance : un locataire de Lille n'a rien à faire dans les signalements
 * d'une résidence de Marseille.
 *
 * Les helpers ci-dessous produisent les filtres Prisma à appliquer. Ils sont
 * volontairement centralisés : un filtre oublié dans une seule requête suffit
 * à faire fuiter les données d'une autre résidence.
 */

export type Scope =
  /** Compte non rattaché : accès global (mode mono-résidence historique). */
  | { kind: "global" }
  /** Compte rattaché : accès limité à une résidence. */
  | { kind: "residence"; residenceId: string };

export function scopeFor(user: { residenceId: string | null }): Scope {
  return user.residenceId
    ? { kind: "residence", residenceId: user.residenceId }
    : { kind: "global" };
}

/**
 * Filtre sur un modèle possédant un `buildingId` NON NULL
 * (IncidentReport, Unit).
 */
export function buildingScopeWhere(scope: Scope) {
  if (scope.kind === "global") return {};
  return { building: { residenceId: scope.residenceId } };
}

/**
 * Filtre sur un modèle dont le `buildingId` est NULLABLE — un contenu
 * « général » (buildingId null) reste visible par tous, car il n'appartient à
 * aucune résidence en particulier (Announcement, Meeting, Document, Petition,
 * Poll, HelpOffer, LandlordStep, ForumCategory).
 */
export function optionalBuildingScopeWhere(scope: Scope) {
  if (scope.kind === "global") return {};
  return {
    OR: [
      { buildingId: null },
      { building: { residenceId: scope.residenceId } },
    ],
  };
}

/** Filtre sur les comptes (annuaire, messagerie, administration). */
export function userScopeWhere(scope: Scope) {
  if (scope.kind === "global") return {};
  return { residenceId: scope.residenceId };
}

/** Bâtiments visibles par ce compte (listes déroulantes, carte, filtres). */
export function buildingsFor(scope: Scope) {
  return prisma.building.findMany({
    where: scope.kind === "global" ? {} : { residenceId: scope.residenceId },
    orderBy: { code: "asc" },
  });
}

/**
 * Garde-fou en écriture : vérifie qu'un bâtiment ciblé appartient bien au
 * périmètre du compte. À appeler AVANT toute création/modification qui accepte
 * un `buildingId` venant du client, sinon un utilisateur peut écrire dans la
 * résidence d'un autre en forgeant l'identifiant.
 */
export async function assertBuildingInScope(
  scope: Scope,
  buildingId: string | null | undefined,
): Promise<void> {
  if (!buildingId) return; // contenu général
  if (scope.kind === "global") return;
  const ok = await prisma.building.findFirst({
    where: { id: buildingId, residenceId: scope.residenceId },
    select: { id: true },
  });
  if (!ok) throw new Error("Bâtiment hors de votre résidence.");
}
