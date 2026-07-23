import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isStaff } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { scopeFor, optionalBuildingScopeWhere } from "@/lib/tenancy";
import { Badge, Card } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import { formatDate } from "@/lib/labels";
import { closePoll, deletePoll, votePoll } from "../actions";

export default async function SondageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();
  const { id } = await params;

  const poll = await prisma.poll.findFirst({
    // 404 si le sondage est hors de la résidence de l'utilisateur.
    where: { AND: [optionalBuildingScopeWhere(scope), { id }] },
    include: {
      building: true,
      author: { select: { id: true, firstName: true, lastName: true } },
      options: {
        include: { _count: { select: { votes: true } } },
      },
      votes: { where: { userId: user.id } },
    },
  });
  if (!poll) notFound();

  const myVote = poll.votes[0]?.optionId ?? null;
  const total = poll.options.reduce((sum, o) => sum + o._count.votes, 0);
  const canManage = poll.authorId === user.id || isStaff(user.role);
  const showResults = myVote !== null || poll.closed;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/sondages"
        className="mb-4 inline-block text-sm text-gray-500 hover:underline"
      >
        ← {t("Retour aux sondages")}
      </Link>

      <Card>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {poll.closed ? (
            <Badge className="border-gray-200 bg-gray-100 text-gray-600">
              {t("Clôturé")}
            </Badge>
          ) : (
            <Badge className="border-rose-200 bg-rose-50 text-rose-700">
              {t("Ouvert")}
            </Badge>
          )}
          <Badge className="border-gray-200 bg-gray-50 text-gray-600">
            {poll.building ? t(poll.building.name) : t("Toutes résidences")}
          </Badge>
        </div>

        <h1 className="text-xl font-bold text-gray-900">{poll.question}</h1>

        {!poll.closed ? (
          <form action={votePoll} className="mt-4 space-y-2">
            <input type="hidden" name="pollId" value={poll.id} />
            {poll.options.map((o) => {
              const votes = o._count.votes;
              const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
              const mine = myVote === o.id;
              return (
                <button
                  key={o.id}
                  type="submit"
                  name="optionId"
                  value={o.id}
                  className={`relative block w-full overflow-hidden rounded-lg border px-4 py-3 text-left transition ${
                    mine
                      ? "border-rose-400 bg-rose-50"
                      : "border-gray-200 bg-white hover:border-rose-200"
                  }`}
                >
                  {showResults ? (
                    <span
                      className="absolute inset-y-0 left-0 bg-rose-100/70"
                      style={{ width: `${pct}%` }}
                    />
                  ) : null}
                  <span className="relative flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {mine ? "✓ " : ""}
                      {o.label}
                    </span>
                    {showResults ? (
                      <span className="text-sm text-gray-600">
                        {votes} ({pct}%)
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
            {!showResults ? (
              <p className="pt-1 text-xs text-gray-500">
                {t(
                  "Cliquez sur une option pour voter. Les résultats s'affichent après votre vote.",
                )}
              </p>
            ) : (
              <p className="pt-1 text-xs text-gray-500">
                {t("Vous pouvez changer votre vote tant que le sondage est ouvert.")}
              </p>
            )}
          </form>
        ) : (
          <div className="mt-4 space-y-2">
            {poll.options.map((o) => {
              const votes = o._count.votes;
              const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
              return (
                <div
                  key={o.id}
                  className="relative overflow-hidden rounded-lg border border-gray-200 px-4 py-3"
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-rose-100/70"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="relative flex items-center justify-between">
                    <span className="font-medium text-gray-900">{o.label}</span>
                    <span className="text-sm text-gray-600">
                      {votes} ({pct}%)
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500">
            {total} {t("vote(s)")} · {t("par")} {poll.author.firstName}{" "}
            {poll.author.lastName} · {formatDate(poll.createdAt)}
          </p>
          {canManage ? (
            <div className="flex items-center gap-2">
              <form action={closePoll}>
                <input type="hidden" name="pollId" value={poll.id} />
                <ConfirmButton
                  variant="neutral"
                  confirmMessage={
                    poll.closed
                      ? t("Rouvrir ce sondage ?")
                      : t("Clôturer ce sondage ?")
                  }
                >
                  {poll.closed ? t("Rouvrir") : t("Clôturer")}
                </ConfirmButton>
              </form>
              <form action={deletePoll}>
                <input type="hidden" name="pollId" value={poll.id} />
                <ConfirmButton
                  variant="ghost"
                  confirmMessage={t(
                    "Supprimer définitivement ce sondage et ses votes ?",
                  )}
                >
                  🗑️ {t("Supprimer")}
                </ConfirmButton>
              </form>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
