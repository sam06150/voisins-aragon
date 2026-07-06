import type { Role } from "@prisma/client";

/**
 * Hiérarchie des rôles (du moins au plus privilégié) :
 * - TENANT     : locataire
 * - MODERATOR  : modérateur (modère le forum, gère le statut des signalements)
 * - SUBADMIN   : sous-admin (tout, sauf gérer les rôles et la sauvegarde)
 * - ADMIN      : référent principal (tout, y compris les rôles)
 */
export const ROLE_RANK: Record<Role, number> = {
  TENANT: 0,
  MODERATOR: 1,
  SUBADMIN: 2,
  ADMIN: 3,
};

export function rank(role: Role): number {
  return ROLE_RANK[role] ?? 0;
}

/** Membre de l'équipe (modérateur, sous-admin ou admin). */
export function isStaff(role: Role): boolean {
  return rank(role) >= ROLE_RANK.MODERATOR;
}

/** Peut gérer le contenu et les comptes (sous-admin ou admin). */
export function isManager(role: Role): boolean {
  return rank(role) >= ROLE_RANK.SUBADMIN;
}

/** Référent principal : peut gérer les rôles et la sauvegarde. */
export function isAdmin(role: Role): boolean {
  return rank(role) >= ROLE_RANK.ADMIN;
}
