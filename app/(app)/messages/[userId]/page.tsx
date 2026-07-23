import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { scopeFor, userScopeWhere } from "@/lib/tenancy";
import { Button, Card, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/labels";
import { replyMessage } from "../actions";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();
  const { userId: partnerId } = await params;

  const partner = await prisma.user.findFirst({
    where: { ...userScopeWhere(scope), id: partnerId, status: "APPROVED" },
  });
  if (!partner) notFound();

  // Marquer comme lus les messages reçus de cet interlocuteur.
  await prisma.privateMessage.updateMany({
    where: { senderId: partnerId, recipientId: user.id, read: false },
    data: { read: true },
  });

  const messages = await prisma.privateMessage.findMany({
    where: {
      OR: [
        { senderId: user.id, recipientId: partnerId },
        { senderId: partnerId, recipientId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/messages"
        className="mb-4 inline-block text-sm text-gray-500 hover:underline"
      >
        ← {t("Toutes les conversations")}
      </Link>

      <h1 className="mb-4 text-xl font-bold text-gray-900">
        {partner.firstName} {partner.lastName}
      </h1>

      <div className="space-y-2">
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "bg-rose-600 text-white"
                    : "border border-gray-200 bg-white text-gray-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    mine ? "text-rose-100" : "text-gray-500"
                  }`}
                >
                  {formatDateTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div id="bas" />

      <Card className="mt-4">
        <form action={replyMessage} className="space-y-3">
          <input type="hidden" name="recipientId" value={partner.id} />
          <Textarea
            name="body"
            required
            placeholder={`${t("Écrire à")} ${partner.firstName}…`}
            aria-label={`${t("Écrire à")} ${partner.firstName}`}
            className="min-h-16"
          />
          <Button type="submit">{t("Envoyer")}</Button>
        </form>
      </Card>
    </div>
  );
}
