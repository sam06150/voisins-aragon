import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Sauvegarde complète de la base au format JSON (toutes les tables).
 * Portable : fonctionne aussi bien sur Postgres/Neon (production) que sur
 * SQLite (dev local), sans binaire externe (pg_dump). Réservé aux admins.
 *
 * RGPD / minimisation : on N'EXPORTE PAS les `passwordHash` (secrets d'auth) ni
 * les abonnements push (tokens d'appareils). Le fichier reste sensible
 * (coordonnées, messages privés) : à conserver en lieu sûr et à durée limitée.
 */
export async function GET() {
  await requireAdmin();

  try {
    // Transaction en lecture : snapshot cohérent de toutes les tables.
    const [
      residences,
      buildings,
      settings,
      units,
      users,
      incidentReports,
      incidentPhotos,
      forumCategories,
      forumThreads,
      forumPosts,
      announcements,
      meetings,
      documents,
      notifications,
      petitions,
      petitionSignatures,
      polls,
      pollOptions,
      pollVotes,
      incidentSupports,
      meetingRsvps,
      privateMessages,
      helpOffers,
      landlordSteps,
    ] = await prisma.$transaction([
      prisma.residence.findMany(),
      prisma.building.findMany(),
      prisma.setting.findMany(),
      prisma.unit.findMany(),
      // Utilisateurs SANS passwordHash (secret d'authentification).
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          signupResidenceName: true,
          signupBuildingName: true,
          signupBuildingId: true,
          signupUnitLabel: true,
          unitId: true,
          shareInDirectory: true,
          shareEmail: true,
          sharePhone: true,
          emailNotifications: true,
          lastSeenAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.incidentReport.findMany(),
      prisma.incidentPhoto.findMany(),
      prisma.forumCategory.findMany(),
      prisma.forumThread.findMany(),
      prisma.forumPost.findMany(),
      prisma.announcement.findMany(),
      prisma.meeting.findMany(),
      prisma.document.findMany(),
      prisma.notification.findMany(),
      prisma.petition.findMany(),
      prisma.petitionSignature.findMany(),
      prisma.poll.findMany(),
      prisma.pollOption.findMany(),
      prisma.pollVote.findMany(),
      prisma.incidentSupport.findMany(),
      prisma.meetingRSVP.findMany(),
      prisma.privateMessage.findMany(),
      prisma.helpOffer.findMany(),
      prisma.landlordStep.findMany(),
    ]);

    const backup = {
      _meta: {
        app: "Voisins Collectif et en Colère",
        format: "json-full",
        version: 2,
        exportedAt: new Date().toISOString(),
        note: "passwordHash et tokens push exclus (RGPD).",
      },
      residences,
      buildings,
      settings,
      units,
      users,
      incidentReports,
      incidentPhotos,
      forumCategories,
      forumThreads,
      forumPosts,
      announcements,
      meetings,
      documents,
      notifications,
      petitions,
      petitionSignatures,
      polls,
      pollOptions,
      pollVotes,
      incidentSupports,
      meetingRsvps,
      privateMessages,
      helpOffers,
      landlordSteps,
    };

    // Pas d'indentation : réduit la taille et l'empreinte mémoire du fichier.
    const json = JSON.stringify(backup);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    return new Response(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="sauvegarde-aragon-${stamp}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Échec de la génération de la sauvegarde :", err);
    return new Response("La génération de la sauvegarde a échoué.", {
      status: 500,
    });
  }
}
