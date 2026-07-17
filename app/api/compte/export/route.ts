import { requireApproved } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Droit à la portabilité (RGPD) : le locataire connecté exporte SES propres
 * données au format JSON (profil + contributions). Ne contient jamais le
 * mot de passe.
 */
export async function GET() {
  const user = await requireApproved();
  const uid = user.id;

  try {
    const [
      profile,
      incidents,
      forumThreads,
      forumPosts,
      sentMessages,
      receivedMessages,
      petitionSignatures,
      pollVotes,
      meetingRsvps,
      incidentSupports,
      helpOffers,
      notifications,
    ] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: uid },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          shareInDirectory: true,
          shareEmail: true,
          sharePhone: true,
          emailNotifications: true,
          consentAt: true,
          createdAt: true,
          unit: { select: { label: true, floor: true, building: { select: { name: true } } } },
        },
      }),
      prisma.incidentReport.findMany({ where: { authorId: uid } }),
      prisma.forumThread.findMany({ where: { authorId: uid } }),
      prisma.forumPost.findMany({ where: { authorId: uid } }),
      prisma.privateMessage.findMany({ where: { senderId: uid } }),
      prisma.privateMessage.findMany({ where: { recipientId: uid } }),
      prisma.petitionSignature.findMany({ where: { userId: uid } }),
      prisma.pollVote.findMany({ where: { userId: uid } }),
      prisma.meetingRSVP.findMany({ where: { userId: uid } }),
      prisma.incidentSupport.findMany({ where: { userId: uid } }),
      prisma.helpOffer.findMany({ where: { authorId: uid } }),
      prisma.notification.findMany({ where: { userId: uid } }),
    ]);

    const data = {
      _meta: {
        app: "Voisins Collectif et en Colère",
        export: "mes-donnees",
        exportedAt: new Date().toISOString(),
      },
      profile,
      incidents,
      forumThreads,
      forumPosts,
      sentMessages,
      receivedMessages,
      petitionSignatures,
      pollVotes,
      meetingRsvps,
      incidentSupports,
      helpOffers,
      notifications,
    };

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="mes-donnees-${stamp}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Échec de l'export des données personnelles :", err);
    return new Response("L'export a échoué.", { status: 500 });
  }
}
