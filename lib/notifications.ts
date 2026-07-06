import { prisma } from "./db";
import type { NotificationType } from "@prisma/client";
import { sendEmail, emailLayout } from "./email";

/**
 * Crée une notification pour tous les locataires approuvés concernés,
 * en excluant l'auteur. Si buildingId est fourni, cible les résidents de
 * ce bâtiment (+ ceux sans logement rattaché, pour ne rien manquer).
 * Si `email` est vrai, envoie aussi un e-mail aux locataires qui l'ont accepté.
 */
export async function notifyResidents(params: {
  type: NotificationType;
  message: string;
  link?: string;
  buildingId?: string | null;
  excludeUserId?: string;
  email?: boolean;
}) {
  const { type, message, link, buildingId, excludeUserId, email } = params;

  const users = await prisma.user.findMany({
    where: {
      status: "APPROVED",
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      ...(buildingId
        ? {
            OR: [{ unit: { buildingId } }, { unitId: null }],
          }
        : {}),
    },
    select: { id: true, email: true, emailNotifications: true },
  });

  if (users.length === 0) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type,
      message,
      link: link ?? null,
    })),
  });

  if (email) {
    const recipients = users.filter((u) => u.emailNotifications);
    await Promise.all(
      recipients.map((u) =>
        sendEmail({
          to: u.email,
          subject: message,
          html: emailLayout(message, "<p>Connectez-vous pour en savoir plus.</p>"),
        }),
      ),
    );
  }
}

/** Notifie un utilisateur précis (ex: nouveau message privé). */
export async function notifyUser(params: {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
  email?: boolean;
}) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      message: params.message,
      link: params.link ?? null,
    },
  });

  if (params.email) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, emailNotifications: true },
    });
    if (user && user.emailNotifications) {
      await sendEmail({
        to: user.email,
        subject: params.message,
        html: emailLayout(
          params.message,
          "<p>Connectez-vous pour consulter votre message.</p>",
        ),
      });
    }
  }
}
