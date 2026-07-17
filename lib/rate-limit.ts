// Limiteur de tentatives en mémoire (suffisant pour un déploiement local
// à process unique). Verrouille après trop d'échecs sur une fenêtre glissante.

type Entry = { count: number; first: number; blockedUntil: number };

const attempts = new Map<string, Entry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const BLOCK_MS = 15 * 60 * 1000; // 15 min de blocage

/**
 * Enregistre une tentative ET renvoie si elle est autorisée, de façon atomique
 * (synchrone). À appeler AVANT la vérification du mot de passe pour fermer la
 * fenêtre de course : sinon N requêtes concurrentes passent toutes le contrôle
 * avant qu'aucune n'incrémente le compteur.
 *
 * Limite : le compteur est en mémoire (non partagé entre instances Render,
 * remis à zéro au redémarrage). Pour une protection robuste en production
 * multi-instances, brancher un store partagé (Redis/Upstash) avec INCR atomique.
 */
export function registerAttempt(key: string): {
  allowed: boolean;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const entry = attempts.get(key);

  if (entry && entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now, blockedUntil: 0 });
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
    return { allowed: false, retryAfterSec: Math.ceil(BLOCK_MS / 1000) };
  }
  return { allowed: true };
}

/** À appeler après un succès pour réinitialiser le compteur. */
export function registerSuccess(key: string): void {
  attempts.delete(key);
}
