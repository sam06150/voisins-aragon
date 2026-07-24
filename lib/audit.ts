import { prisma } from "./db";

/**
 * Enregistre une action sensible dans le journal d'audit.
 *
 * Best-effort : une erreur d'écriture du journal ne doit jamais faire échouer
 * l'action métier qui vient d'aboutir. On avale donc l'exception (au pire, une
 * ligne de journal manque — ce n'est pas bloquant).
 */
export async function logAudit(
  actor: { id: string; firstName: string; lastName: string; residenceId: string | null },
  action: string,
  opts: { target?: string; detail?: string } = {},
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        action,
        target: opts.target ?? null,
        detail: opts.detail ?? null,
        residenceId: actor.residenceId,
      },
    });
  } catch {
    // journal non critique : on n'interrompt pas l'action métier
  }
}
