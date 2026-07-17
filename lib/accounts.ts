// Préfixe d'e-mail marquant un compte "supprimé" (anonymisé).
// Utilisé pour filtrer ces comptes des listes.
export const DELETED_EMAIL_PREFIX = "supprime-";

/**
 * Champs d'anonymisation d'un compte (droit à l'effacement / rétention).
 * Efface les données personnelles et coupe l'accès, tout en conservant la
 * ligne User (les contributions collectives restent rattachées, anonymes).
 * `randomHash` : un hash bcrypt aléatoire (mot de passe inutilisable).
 */
export function anonymizedUserData(userId: string, randomHash: string) {
  return {
    firstName: "Compte",
    lastName: "supprimé",
    email: `${DELETED_EMAIL_PREFIX}${userId}@aragon.local`,
    phone: null,
    passwordHash: randomHash,
    status: "REJECTED" as const,
    role: "TENANT" as const,
    unitId: null,
    shareInDirectory: false,
    shareEmail: false,
    sharePhone: false,
    emailNotifications: false,
    lastSeenAt: null,
    consentAt: null,
  };
}
