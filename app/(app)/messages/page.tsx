import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/labels";

export default async function MessagesPage() {
  const user = await requireApproved();
  const { t } = await getI18n();

  const messages = await prisma.privateMessage.findMany({
    where: {
      OR: [{ senderId: user.id }, { recipientId: user.id }],
    },
    // On ne sélectionne que le strict nécessaire : ne jamais charger l'objet
    // User entier (qui contient passwordHash, e-mail…) pour l'affichage.
    select: {
      senderId: true,
      recipientId: true,
      body: true,
      read: true,
      createdAt: true,
      sender: { select: { id: true, firstName: true, lastName: true } },
      recipient: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Regroupement par interlocuteur.
  type Convo = {
    partnerId: string;
    partnerName: string;
    lastBody: string;
    lastAt: Date;
    unread: number;
  };
  const convos = new Map<string, Convo>();
  for (const m of messages) {
    const partner = m.senderId === user.id ? m.recipient : m.sender;
    const isUnread = m.recipientId === user.id && !m.read;
    const existing = convos.get(partner.id);
    if (!existing) {
      convos.set(partner.id, {
        partnerId: partner.id,
        partnerName: `${partner.firstName} ${partner.lastName}`,
        lastBody: m.body,
        lastAt: m.createdAt,
        unread: isUnread ? 1 : 0,
      });
    } else if (isUnread) {
      existing.unread += 1;
    }
  }
  const list = [...convos.values()].sort(
    (a, b) => b.lastAt.getTime() - a.lastAt.getTime(),
  );

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Messagerie")}
        description={t("Vos échanges privés avec les autres locataires.")}
        action={
          <LinkButton href="/messages/nouveau">
            + {t("Nouveau message")}
          </LinkButton>
        }
      />

      {list.length === 0 ? (
        <EmptyState>
          {t("Aucune conversation. Écrivez à un voisin via « Nouveau message ».")}
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {list.map((c) => (
            <Link key={c.partnerId} href={`/messages/${c.partnerId}`} className="block">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:shadow">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {c.partnerName}
                    </span>
                    {c.unread > 0 ? (
                      <Badge className="border-rose-200 bg-rose-600 text-white">
                        {c.unread}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-gray-500">
                    {c.lastBody}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatDateTime(c.lastAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
