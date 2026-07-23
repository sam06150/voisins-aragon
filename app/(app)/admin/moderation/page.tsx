import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { scopeFor, optionalBuildingScopeWhere } from "@/lib/tenancy";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import { formatDateTime } from "@/lib/labels";
import { deleteThread, toggleThreadLock } from "../../forum/actions";

export default async function AdminModerationPage() {
  const admin = await requireStaff();
  const scope = scopeFor(admin);
  const { t } = await getI18n();

  const threads = await prisma.forumThread.findMany({
    where: { category: optionalBuildingScopeWhere(scope) }, // résidence
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      category: { include: { building: true } },
      _count: { select: { posts: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-gray-900">
        {t("Modération du forum")}
      </h2>
      <p className="mb-5 text-sm text-gray-600">
        {t(
          "Fermez ou supprimez les discussions. Les 50 discussions les plus récentes sont affichées.",
        )}
      </p>

      {threads.length === 0 ? (
        <EmptyState>{t("Aucune discussion à modérer.")}</EmptyState>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <Card key={thread.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                      {thread.category.building
                        ? t(thread.category.building.name)
                        : t("Général")}
                    </Badge>
                    {thread.isLocked ? (
                      <Badge className="border-gray-200 bg-gray-100 text-gray-600">
                        🔒 {t("Fermée")}
                      </Badge>
                    ) : null}
                  </div>
                  <Link
                    href={`/forum/${thread.categoryId}/${thread.id}`}
                    className="font-semibold text-gray-900 hover:text-rose-700 hover:underline"
                  >
                    {thread.title}
                  </Link>
                  <p className="mt-1 text-xs text-gray-500">
                    {thread.author.firstName} {thread.author.lastName} ·{" "}
                    {thread._count.posts} {t("messages")} ·{" "}
                    {formatDateTime(thread.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={toggleThreadLock}>
                    <input type="hidden" name="threadId" value={thread.id} />
                    <Button type="submit" variant="secondary">
                      {thread.isLocked ? t("Rouvrir") : t("Fermer")}
                    </Button>
                  </form>
                  <form action={deleteThread}>
                    <input type="hidden" name="threadId" value={thread.id} />
                    <ConfirmButton
                      confirmMessage={t(
                        "Supprimer cette discussion et tous ses messages ?",
                      )}
                    >
                      {t("Supprimer")}
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
