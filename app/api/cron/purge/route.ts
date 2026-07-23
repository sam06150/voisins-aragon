import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { anonymizedUserData } from "@/lib/accounts";

/**
 * Purge de rétention (RGPD), déclenchée périodiquement par un planificateur
 * externe (GitHub Actions) avec l'en-tête `Authorization: Bearer <CRON_SECRET>`.
 *
 * - Comptes en attente > 12 mois : supprimés (jamais validés, sans contribution).
 * - Comptes approuvés inactifs > 3 ans : anonymisés (hors administrateurs).
 * - Candidatures publiques (JoinRequest) > 12 mois : supprimées.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Non autorisé", { status: 401 });
  }

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const twelveMonthsAgo = new Date(now - 365 * DAY);
  const threeYearsAgo = new Date(now - 3 * 365 * DAY);

  try {
    // 1) Comptes en attente jamais validés depuis > 12 mois (aucune contribution
    //    rattachée → suppression définitive sans risque d'intégrité).
    const pending = await prisma.user.deleteMany({
      where: { status: "PENDING", createdAt: { lt: twelveMonthsAgo } },
    });

    // 1 bis) Candidatures publiques (« Rejoindre » / « Devenir référent ») non
    //        transformées en compte depuis > 12 mois : suppression définitive.
    const joinRequests = await prisma.joinRequest.deleteMany({
      where: { createdAt: { lt: twelveMonthsAgo } },
    });

    // 2) Comptes approuvés inactifs depuis > 3 ans → anonymisation (on conserve
    //    les contributions collectives). Les administrateurs sont épargnés.
    const inactive = await prisma.user.findMany({
      where: {
        status: "APPROVED",
        role: { not: "ADMIN" },
        lastSeenAt: { lt: threeYearsAgo },
      },
      select: { id: true },
    });

    for (const u of inactive) {
      const randomHash = await hashPassword(randomUUID());
      await prisma.$transaction([
        prisma.privateMessage.updateMany({
          where: { senderId: u.id },
          data: { body: "[message supprimé]" },
        }),
        prisma.pushSubscription.deleteMany({ where: { userId: u.id } }),
        prisma.user.update({
          where: { id: u.id },
          data: anonymizedUserData(u.id, randomHash),
        }),
      ]);
    }

    return Response.json({
      ok: true,
      pendingDeleted: pending.count,
      joinRequestsDeleted: joinRequests.count,
      inactiveAnonymized: inactive.length,
    });
  } catch (err) {
    console.error("Échec de la purge de rétention :", err);
    return new Response("Échec de la purge.", { status: 500 });
  }
}
