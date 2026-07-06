// Limiteur de tentatives en mémoire (suffisant pour un déploiement local
// à process unique). Verrouille après trop d'échecs sur une fenêtre glissante.

type Entry = { count: number; first: number; blockedUntil: number };

const attempts = new Map<string, Entry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const BLOCK_MS = 15 * 60 * 1000; // 15 min de blocage

export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry) return { allowed: true };

  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  // Fenêtre expirée : on repart de zéro.
  if (now - entry.first > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

/** À appeler après un échec d'authentification. */
export function registerFailure(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now, blockedUntil: 0 });
    return;
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
  }
}

/** À appeler après un succès pour réinitialiser le compteur. */
export function registerSuccess(key: string): void {
  attempts.delete(key);
}
