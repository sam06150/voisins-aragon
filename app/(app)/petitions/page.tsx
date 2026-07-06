import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/labels";

export default async function PetitionsPage() {
  await requireApproved();
  const { t } = await getI18n();

  const petitions = await prisma.petition.findMany({
    include: {
      building: true,
      author: true,
      _count: { select: { signatures: true } },
    },
    orderBy: [{ closed: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <PageHeader
        title={t("Pétitions")}
        description={t(
          "Lancez et signez des pétitions pour peser collectivement face au bailleur.",
        )}
        action={
          <LinkButton href="/petitions/nouveau">
            + {t("Lancer une pétition")}
          </LinkButton>
        }
      />

      {petitions.length === 0 ? (
        <EmptyState>
          {t("Aucune pétition pour le moment. Lancez la première !")}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {petitions.map((p) => {
            const count = p._count.signatures;
            const pct = p.goal ? Math.min(100, Math.round((count / p.goal) * 100)) : null;
            return (
              <Link key={p.id} href={`/petitions/${p.id}`} className="block">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:shadow">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {p.closed ? (
                      <Badge className="border-gray-200 bg-gray-100 text-gray-600">
                        {t("Clôturée")}
                      </Badge>
                    ) : (
                      <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                        {t("En cours")}
                      </Badge>
                    )}
                    <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                      {p.building ? t(p.building.name) : t("Toutes résidences")}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {p.description}
                  </p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-900">
                        {count} {t("signature(s)")}
                      </span>
                      {p.goal ? (
                        <span className="text-gray-500">
                          {t("objectif :")} {p.goal}
                        </span>
                      ) : null}
                    </div>
                    {pct !== null ? (
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-rose-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {t("Lancée par")} {p.author.firstName} {p.author.lastName} ·{" "}
                    {formatDate(p.createdAt)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
