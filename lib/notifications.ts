import { prisma } from "./db";
import type { NotificationType } from "@prisma/client";
import { sendEmail, emailLayout } from "./email";
import { sendPushToUsers } from "./push";

const APP_URL = process.env.APP_URL || "";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Corps HTML d'un e-mail de notification : le détail + un bouton vers l'appli. */
function notificationEmailHtml(detail: string | undefined, link?: string): string {
  const href = link ? `${APP_URL}${link}` : APP_URL || "#";
  const detailHtml = detail
    ? `<p style="white-space:pre-wrap;">${escapeHtml(detail).replace(/\n/g, "<br>")}</p>`
    : "<p>Connectez-vous pour en savoir plus.</p>";
  const button = APP_URL
    ? `<p style="margin-top:20px;"><a href="${href}" style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:bold;">Ouvrir la plateforme</a></p>`
    : "";
  return detailHtml + button;
}

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
  /**
   * Cloisonnement : si fourni, ne notifie que les comptes de cette résidence.
   * Indispensable pour une annonce « générale » (buildingId null) — sans ça,
   * elle partirait à toutes les résidences de l'instance.
   */
  residenceId?: string | null;
  excludeUserId?: string;
  email?: boolean;
  detail?: string;
}) {
  const {
    type,
    message,
    link,
    buildingId,
    residenceId,
    excludeUserId,
    email,
    detail,
  } = params;

  const users = await prisma.user.findMany({
    where: {
      status: "APPROVED",
      ...(residenceId ? { residenceId } : {}),
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

  // Notifications push (téléphone), best effort.
  await sendPushToUsers(
    users.map((u) => u.id),
    { title: message, body: detail, url: link },
  );

  if (email) {
    const recipients = users.filter((u) => u.emailNotifications);
    const html = emailLayout(message, notificationEmailHtml(detail, link));
    // allSettled : l'échec d'un envoi ne doit pas faire échouer les autres ni
    // l'action appelante (les notifications in-app sont déjà créées).
    await Promise.allSettled(
      recipients.map((u) =>
        sendEmail({ to: u.email, subject: message, html }),
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

  await sendPushToUsers([params.userId], {
    title: params.message,
    url: params.link,
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
