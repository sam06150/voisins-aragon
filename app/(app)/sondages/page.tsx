import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/labels";

export default async function SondagesPage() {
  await requireApproved();
  const { t } = await getI18n();

  const polls = await prisma.poll.findMany({
    include: {
      building: true,
      author: true,
      _count: { select: { votes: true } },
    },
    orderBy: [{ closed: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <PageHeader
        title={t("Sondages")}
        description={t(
          "Prenez les décisions collectivement : proposez une question, chacun vote.",
        )}
        action={
          <LinkButton href="/sondages/nouveau">
            + {t("Créer un sondage")}
          </LinkButton>
        }
      />

      {polls.length === 0 ? (
        <EmptyState>{t("Aucun sondage pour le moment.")}</EmptyState>
      ) : (
        <div className="space-y-3">
          {polls.map((p) => (
            <Link key={p.id} href={`/sondages/${p.id}`} className="block">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:shadow">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {p.closed ? (
                    <Badge className="border-gray-200 bg-gray-100 text-gray-600">
                      {t("Clôturé")}
                    </Badge>
                  ) : (
                    <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                      {t("Ouvert")}
                    </Badge>
                  )}
                  <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                    {p.building ? t(p.building.name) : t("Toutes résidences")}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900">{p.question}</h3>
                <p className="mt-2 text-xs text-gray-400">
                  {p._count.votes} {t("vote(s)")} · {t("par")}{" "}
                  {p.author.firstName} {p.author.lastName} · {formatDate(p.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
