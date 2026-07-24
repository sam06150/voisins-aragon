import { prisma } from "@/lib/db";
import { sendEmail, emailLayout, emailConfigured } from "@/lib/email";
import {
  type Scope,
  buildingScopeWhere,
  optionalBuildingScopeWhere,
  userScopeWhere,
} from "@/lib/tenancy";

/**
 * Résumé hebdomadaire par e-mail, déclenché par un planificateur externe
 * (GitHub Actions) avec `Authorization: Bearer <CRON_SECRET>`.
 *
 * Pour chaque résidence, on calcule l'activité des 7 derniers jours et on
 * envoie un e-mail récapitulatif aux locataires qui acceptent les e-mails.
 * Cloisonnement : chaque locataire ne reçoit que les chiffres de SA résidence.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Non autorisé", { status: 401 });
  }
  if (!emailConfigured()) {
    return Response.json({ ok: false, reason: "email non configuré" });
  }

  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const inTwoWeeks = new Date(now.getTime() + 14 * DAY);

  // Groupes de destinataires : une entrée par résidence + le groupe historique
  // (comptes sans résidence rattachée).
  const groups = await prisma.user.groupBy({
    by: ["residenceId"],
    where: { status: "APPROVED", emailNotifications: true },
    _count: { _all: true },
  });

  let sent = 0;
  const results: { residenceId: string | null; recipients: number }[] = [];

  for (const g of groups) {
    const scope: Scope = g.residenceId
      ? { kind: "residence", residenceId: g.residenceId }
      : { kind: "global" };

    const incidentWhere = buildingScopeWhere(scope);
    const scopeWhere = optionalBuildingScopeWhere(scope);

    const [
      newIncidents,
      resolvedIncidents,
      openIncidents,
      brokenPromises,
      newPetitions,
      newSignatures,
      newAnnouncements,
      nextMeeting,
      recipients,
    ] = await Promise.all([
      prisma.incidentReport.count({
        where: { AND: [incidentWhere, { createdAt: { gte: weekAgo } }] },
      }),
      prisma.incidentReport.count({
        where: { AND: [incidentWhere, { resolvedAt: { gte: weekAgo } }] },
      }),
      prisma.incidentReport.count({
        where: { AND: [incidentWhere, { status: { in: ["OUVERT", "EN_COURS"] } }] },
      }),
      prisma.incidentReport.count({
        where: {
          AND: [
            incidentWhere,
            { resolvedAt: null, landlordPromiseAt: { lt: now } },
          ],
        },
      }),
      prisma.petition.count({
        where: { AND: [scopeWhere, { createdAt: { gte: weekAgo } }] },
      }),
      prisma.petitionSignature.count({
        where: { petition: scopeWhere, createdAt: { gte: weekAgo } },
      }),
      prisma.announcement.count({
        where: { AND: [scopeWhere, { createdAt: { gte: weekAgo } }] },
      }),
      prisma.meeting.findFirst({
        where: {
          AND: [scopeWhere, { scheduledAt: { gte: now, lt: inTwoWeeks } }],
        },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.user.findMany({
        where: {
          ...userScopeWhere(scope),
          status: "APPROVED",
          emailNotifications: true,
        },
        select: { email: true, firstName: true },
      }),
    ]);

    // Rien de neuf cette semaine : on n'envoie pas d'e-mail vide.
    const hasNews =
      newIncidents > 0 ||
      resolvedIncidents > 0 ||
      brokenPromises > 0 ||
      newPetitions > 0 ||
      newSignatures > 0 ||
      newAnnouncements > 0 ||
      nextMeeting !== null;
    if (!hasNews || recipients.length === 0) {
      results.push({ residenceId: g.residenceId, recipients: 0 });
      continue;
    }

    const rows: string[] = [];
    if (newIncidents > 0)
      rows.push(`🆕 ${newIncidents} nouveau(x) signalement(s)`);
    if (resolvedIncidents > 0)
      rows.push(`✅ ${resolvedIncidents} signalement(s) résolu(s)`);
    if (openIncidents > 0)
      rows.push(`📌 ${openIncidents} signalement(s) toujours actif(s)`);
    if (brokenPromises > 0)
      rows.push(
        `⛔ ${brokenPromises} promesse(s) du bailleur non tenue(s)`,
      );
    if (newPetitions > 0) rows.push(`✍️ ${newPetitions} nouvelle(s) pétition(s)`);
    if (newSignatures > 0)
      rows.push(`🖊️ ${newSignatures} nouvelle(s) signature(s) de pétition`);
    if (newAnnouncements > 0)
      rows.push(`📣 ${newAnnouncements} nouvelle(s) annonce(s)`);
    if (nextMeeting) {
      const d = nextMeeting.scheduledAt.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      rows.push(`🗓️ Prochaine réunion : « ${nextMeeting.title} » — ${d}`);
    }

    const bodyHtml =
      `<p>Voici l'activité du collectif cette semaine :</p><ul>` +
      rows.map((r) => `<li style="margin:4px 0;">${r}</li>`).join("") +
      `</ul>`;
    const html = emailLayout("Le récap' de la semaine", bodyHtml);

    // Envoi best-effort : l'échec d'un e-mail ne bloque pas les autres.
    await Promise.allSettled(
      recipients.map((u) =>
        sendEmail({
          to: u.email,
          subject: "Voisins Collectif — le récap' de la semaine",
          html,
        }),
      ),
    );
    sent += recipients.length;
    results.push({ residenceId: g.residenceId, recipients: recipients.length });
  }

  return Response.json({ ok: true, emailsSent: sent, groups: results });
}
