import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isStaff } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { scopeFor, optionalBuildingScopeWhere } from "@/lib/tenancy";
import { Alert, Badge, Button, Card, Textarea } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import { formatDateTime } from "@/lib/labels";
import {
  createPost,
  deletePost,
  deleteThread,
  toggleThreadLock,
} from "../../actions";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryId: string; threadId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();
  const { categoryId, threadId } = await params;
  const { error } = await searchParams;
  const isAdmin = isStaff(user.role);

  const thread = await prisma.forumThread.findFirst({
    // 404 si le fil est hors de la résidence de l'utilisateur.
    where: { AND: [{ category: optionalBuildingScopeWhere(scope) }, { id: threadId }] },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      category: { include: { building: true } },
      posts: {
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!thread || thread.categoryId !== categoryId) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/forum/${categoryId}`}
        className="mb-4 inline-block text-sm text-gray-500 hover:underline"
      >
        ← {t(thread.category.name)}
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
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
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900">
            {thread.title}
          </h1>
        </div>

        {isAdmin ? (
          <div className="flex gap-2">
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
        ) : null}
      </div>

      {error === "locked" ? (
        <div className="mb-4">
          <Alert kind="warning">
            {t("Cette discussion est fermée, vous ne pouvez plus y répondre.")}
          </Alert>
        </div>
      ) : null}

      <div className="space-y-3">
        {thread.posts.map((p, index) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-800">
                {p.author.firstName} {p.author.lastName}
                {index === 0 ? (
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-normal text-gray-500">
                    {t("auteur")}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {formatDateTime(p.createdAt)}
                </span>
                {isAdmin && thread.posts.length > 1 ? (
                  <form action={deletePost}>
                    <input type="hidden" name="postId" value={p.id} />
                    <ConfirmButton
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      confirmMessage={t("Supprimer ce message ?")}
                    >
                      {t("Supprimer")}
                    </ConfirmButton>
                  </form>
                ) : null}
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-gray-700">{p.body}</p>
          </Card>
        ))}
      </div>

      <div id="bas" />

      {thread.isLocked && !isAdmin ? (
        <div className="mt-5">
          <Alert kind="info">
            {t("Discussion fermée aux nouvelles réponses.")}
          </Alert>
        </div>
      ) : (
        <Card className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-gray-800">
            {t("Répondre")}
          </h2>
          <form action={createPost} className="space-y-3">
            <input type="hidden" name="threadId" value={thread.id} />
            <Textarea
              name="body"
              required
              placeholder={t("Votre message…")}
              aria-label={t("Votre réponse")}
            />
            <Button type="submit">{t("Envoyer")}</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
