import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Badge, Card, EmptyState, Input, PageHeader } from "@/components/ui";

type Result = {
  href: string;
  title: string;
  snippet?: string;
  tag: string;
};

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireApproved();
  const { t } = await getI18n();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  let results: Result[] = [];

  if (query.length >= 2) {
    const [incidents, threads, petitions, polls, documents, announcements, residents] =
      await Promise.all([
        prisma.incidentReport.findMany({
          where: {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
            ],
          },
          take: 8,
          orderBy: { createdAt: "desc" },
        }),
        prisma.forumThread.findMany({
          where: { title: { contains: query } },
          take: 8,
          orderBy: { updatedAt: "desc" },
        }),
        prisma.petition.findMany({
          where: {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
            ],
          },
          take: 8,
        }),
        prisma.poll.findMany({
          where: { question: { contains: query } },
          take: 8,
        }),
        prisma.document.findMany({
          where: { title: { contains: query } },
          take: 8,
        }),
        prisma.announcement.findMany({
          where: {
            OR: [
              { title: { contains: query } },
              { body: { contains: query } },
            ],
          },
          take: 8,
        }),
        prisma.user.findMany({
          where: {
            status: "APPROVED",
            shareInDirectory: true,
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
            ],
          },
          take: 8,
          select: { id: true, firstName: true, lastName: true },
        }),
      ]);

    results = [
      ...incidents.map((i) => ({
        href: `/incidents/${i.id}`,
        title: i.title,
        snippet: i.description,
        tag: "Signalement",
      })),
      ...threads.map((t) => ({
        href: `/forum/${t.categoryId}/${t.id}`,
        title: t.title,
        tag: "Forum",
      })),
      ...petitions.map((p) => ({
        href: `/petitions/${p.id}`,
        title: p.title,
        snippet: p.description,
        tag: "Pétition",
      })),
      ...polls.map((p) => ({
        href: `/sondages/${p.id}`,
        title: p.question,
        tag: "Sondage",
      })),
      ...documents.map((d) => ({
        href: `/documents`,
        title: d.title,
        tag: "Document",
      })),
      ...announcements.map((a) => ({
        href: `/annonces`,
        title: a.title,
        snippet: a.body,
        tag: "Annonce",
      })),
      ...residents.map((r) => ({
        href: `/messages/nouveau?a=${r.id}`,
        title: `${r.firstName} ${r.lastName}`,
        tag: "Voisin",
      })),
    ];
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Recherche")}
        description={t(
          "Cherchez dans les signalements, le forum, les pétitions, les documents…",
        )}
      />

      <form method="get" className="mb-6 flex gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder={t("Que cherchez-vous ?")}
          aria-label={t("Recherche")}
          autoFocus
        />
        <button
          type="submit"
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          {t("Rechercher")}
        </button>
      </form>

      {query.length < 2 ? (
        <EmptyState>{t("Saisissez au moins 2 caractères.")}</EmptyState>
      ) : results.length === 0 ? (
        <EmptyState>{t("Aucun résultat pour")} « {query} ».</EmptyState>
      ) : (
        <div className="space-y-2">
          {results.map((r, idx) => (
            <Link key={idx} href={r.href} className="block">
              <Card className="transition hover:border-rose-200">
                <div className="flex items-center gap-2">
                  <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                    {t(r.tag)}
                  </Badge>
                  <span className="font-semibold text-gray-900">{r.title}</span>
                </div>
                {r.snippet ? (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {r.snippet}
                  </p>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
