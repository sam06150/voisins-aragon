import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function ForumPage() {
  await requireApproved();
  const { t } = await getI18n();

  const categories = await prisma.forumCategory.findMany({
    include: {
      building: true,
      _count: { select: { threads: true } },
    },
  });

  // Général (sans bâtiment) en premier, puis par code de bâtiment.
  const sorted = [...categories].sort((a, b) => {
    const ca = a.building?.code ?? "";
    const cb = b.building?.code ?? "";
    if (!a.building && b.building) return -1;
    if (a.building && !b.building) return 1;
    return ca.localeCompare(cb);
  });

  return (
    <div>
      <PageHeader
        title={t("Forum du collectif")}
        description={t(
          "Échangez, organisez-vous, partagez les infos. Un espace général et un espace par bâtiment.",
        )}
        action={
          <LinkButton href="/forum/nouveau">
            + {t("Nouvelle discussion")}
          </LinkButton>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState>
          {t("Aucune catégorie de forum n'a encore été créée.")}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sorted.map((c) => (
            <Link key={c.id} href={`/forum/${c.id}`} className="block">
              <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {c.building ? "🏢" : "🌍"}
                  </span>
                  <h2 className="font-bold text-gray-900">{t(c.name)}</h2>
                </div>
                {c.description ? (
                  <p className="mt-1 text-sm text-gray-600">{t(c.description)}</p>
                ) : null}
                <p className="mt-3 text-xs font-medium text-gray-400">
                  {c._count.threads} {t("discussion(s)")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
