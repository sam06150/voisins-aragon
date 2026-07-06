import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Button, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/labels";
import { markAllRead, openNotification } from "./actions";

const typeIcons: Record<string, string> = {
  ANNONCE: "📣",
  REUNION: "🗓️",
  FORUM: "💬",
  PETITION: "✍️",
  SONDAGE: "📊",
  MESSAGE: "✉️",
  SYSTEME: "🔔",
};

export default async function NotificationsPage() {
  const user = await requireApproved();
  const { t } = await getI18n();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Notifications")}
        description={t("Vos alertes : annonces, réunions, pétitions, messages…")}
        action={
          hasUnread ? (
            <form action={markAllRead}>
              <Button type="submit" variant="secondary">
                {t("Tout marquer comme lu")}
              </Button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState>{t("Aucune notification pour l'instant.")}</EmptyState>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <form key={n.id} action={openNotification}>
              <input type="hidden" name="notificationId" value={n.id} />
              <input type="hidden" name="link" value={n.link ?? "/notifications"} />
              <button
                type="submit"
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left shadow-sm transition hover:border-rose-200 ${
                  n.read
                    ? "border-gray-200 bg-white"
                    : "border-rose-200 bg-rose-50/50"
                }`}
              >
                <span className="text-xl">{typeIcons[n.type] ?? "🔔"}</span>
                <span className="flex-1">
                  <span className="block text-sm text-gray-800">
                    {n.message}
                  </span>
                  <span className="mt-1 block text-xs text-gray-400">
                    {formatDateTime(n.createdAt)}
                  </span>
                </span>
                {!n.read ? (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                ) : null}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
