import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/labels";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  await requireApproved();
  const { t } = await getI18n();
  const { categoryId } = await params;

  const category = await prisma.forumCategory.findUnique({
    where: { id: categoryId },
    include: { building: true },
  });
  if (!category) notFound();

  const threads = await prisma.forumThread.findMany({
    where: { categoryId },
    include: {
      author: true,
      _count: { select: { posts: true } },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div>
      <Link
        href="/forum"
        className="mb-4 inline-block text-sm text-gray-500 hover:underline"
      >
        ← {t("Toutes les catégories")}
      </Link>

      <PageHeader
        title={t(category.name)}
        description={
          category.building
            ? `${t("Espace de discussion du bâtiment")} ${t(category.building.name)}.`
            : t("Espace de discussion général, toutes résidences confondues.")
        }
        action={
          <LinkButton href={`/forum/nouveau?categorie=${category.id}`}>
            + {t("Nouvelle discussion")}
          </LinkButton>
        }
      />

      {threads.length === 0 ? (
        <EmptyState>
          {t("Aucune discussion ici pour le moment. Lancez la première !")}
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/forum/${categoryId}/${thread.id}`}
              className="block"
            >
              <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:shadow">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {thread.isPinned ? (
                      <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                        📌 {t("Épinglée")}
                      </Badge>
                    ) : null}
                    {thread.isLocked ? (
                      <Badge className="border-gray-200 bg-gray-100 text-gray-600">
                        🔒 {t("Fermée")}
                      </Badge>
                    ) : null}
                    <h3 className="truncate font-semibold text-gray-900">
                      {thread.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {t("Par")} {thread.author.firstName} {thread.author.lastName}{" "}
                    · {t("dernière activité")} {formatDateTime(thread.updatedAt)}
                  </p>
                </div>
                <div className="shrink-0 text-center">
                  <div className="text-lg font-bold text-gray-800">
                    {thread._count.posts}
                  </div>
                  <div className="text-[11px] text-gray-400">{t("messages")}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
