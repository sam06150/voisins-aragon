import webpush from "web-push";
import { prisma } from "./db";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:sdsb.2023@gmail.com";

const enabled = Boolean(publicKey && privateKey);
if (enabled) {
  webpush.setVapidDetails(subject, publicKey!, privateKey!);
}

export function pushConfigured(): boolean {
  return enabled;
}

export function vapidPublicKey(): string | null {
  return publicKey ?? null;
}

export type PushPayload = { title: string; body?: string; url?: string };

/**
 * Envoie une notification push à tous les appareils des utilisateurs donnés.
 * Best effort : les abonnements expirés (404/410) sont nettoyés.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<void> {
  if (!enabled || userIds.length === 0) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body,
        );
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription
            .delete({ where: { id: s.id } })
            .catch(() => {});
        }
      }
    }),
  );
}
