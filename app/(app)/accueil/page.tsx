import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import {
  scopeFor,
  buildingScopeWhere,
  optionalBuildingScopeWhere,
  userScopeWhere,
} from "@/lib/tenancy";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import {
  formatDate,
  formatDateTime,
  incidentCategoryLabels,
  incidentStatusColors,
  incidentStatusLabels,
} from "@/lib/labels";
import { votePoll } from "../sondages/actions";

export default async function AccueilPage() {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();
  const buildingId = user.unit?.buildingId ?? null;
  const scopeWhere = optionalBuildingScopeWhere(scope); // cloisonnement résidence

  const buildingFilter = buildingId
    ? [{ buildingId: null }, { buildingId }]
    : [{ buildingId: null }];

  const onlineSince = new Date(Date.now() - 5 * 60 * 1000);

  const [announcements, incidents, nextMeeting, counts, onlineUsers, featuredPoll] =
    await Promise.all([
      prisma.announcement.findMany({
        where: { AND: [scopeWhere, { OR: buildingFilter }] },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 3,
        // author non utilisé à l'affichage : on ne charge pas l'objet User.
        include: { building: true },
      }),
      prisma.incidentReport.findMany({
        // Scoping : bâtiment de l'utilisateur, borné à sa résidence.
        where: {
          AND: [
            buildingScopeWhere(scope),
            buildingId ? { buildingId } : {},
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { building: true },
      }),
      prisma.meeting.findFirst({
        where: {
          AND: [scopeWhere, { OR: buildingFilter, scheduledAt: { gte: new Date() } }],
        },
        orderBy: { scheduledAt: "asc" },
        include: { building: true },
      }),
      prisma.$transaction([
        prisma.incidentReport.count({
          where: {
            AND: [
              buildingScopeWhere(scope),
              { status: { in: ["OUVERT", "EN_COURS"] } },
            ],
          },
        }),
        prisma.forumThread.count({ where: { category: scopeWhere } }),
        prisma.document.count({ where: scopeWhere }),
      ]),
      prisma.user.findMany({
        where: {
          ...userScopeWhere(scope),
          status: "APPROVED",
          lastSeenAt: { gte: onlineSince },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          unit: { select: { building: { select: { name: true } } } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      // Sondage express épinglé (vote en 1 clic depuis l'accueil).
      prisma.poll.findFirst({
        where: {
          AND: [optionalBuildingScopeWhere(scope), { featured: true, closed: false }],
        },
        orderBy: { createdAt: "desc" },
        include: {
          options: { include: { _count: { select: { votes: true } } } },
          votes: { where: { userId: user.id }, select: { optionId: true } },
        },
      }),
    ]);

  const [openIncidents, threadCount, docCount] = counts;

  const myPollVote = featuredPoll?.votes[0]?.optionId ?? null;
  const pollTotal =
    featuredPoll?.options.reduce((sum, o) => sum + o._count.votes, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title={`${t("Bonjour")} ${user.firstName} 👋`}
        description={t("Le tableau de bord du collectif des locataires.")}
      />

      {featuredPoll ? (
        <Card className="mb-6 border-rose-200 bg-rose-50/40">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">🗳️</span>
            <h2 className="text-lg font-bold text-gray-900">
              {t("Sondage express")}
            </h2>
          </div>
          <p className="mb-3 font-semibold text-gray-900">
            {featuredPoll.question}
          </p>
          <form action={votePoll} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input type="hidden" name="pollId" value={featuredPoll.id} />
            {featuredPoll.options.map((o) => {
              const votes = o._count.votes;
              const pct = pollTotal > 0 ? Math.round((votes / pollTotal) * 100) : 0;
              const mine = myPollVote === o.id;
              const showResults = myPollVote !== null;
              return (
                <button
                  key={o.id}
                  type="submit"
                  name="optionId"
                  value={o.id}
                  className={`relative overflow-hidden rounded-lg border px-4 py-3 text-left transition ${
                    mine
                      ? "border-rose-400 bg-rose-50"
                      : "border-gray-200 bg-white hover:border-rose-300"
                  }`}
                >
                  {showResults ? (
                    <span
                      className="absolute inset-y-0 left-0 bg-rose-100/70"
                      style={{ width: `${pct}%` }}
                    />
                  ) : null}
                  <span className="relative flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">
                      {mine ? "✓ " : ""}
                      {o.label}
                    </span>
                    {showResults ? (
                      <span className="text-sm text-gray-600">{pct}%</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </form>
          <p className="mt-2 text-xs text-gray-500">
            {myPollVote !== null
              ? `${pollTotal} ${t("vote(s)")} · ${t("vous pouvez changer votre vote")}`
              : t("Cliquez pour voter — 1 clic suffit.")}
          </p>
        </Card>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("Signalements actifs")} value={openIncidents} href="/incidents" />
        <StatCard label={t("Discussions")} value={threadCount} href="/forum" />
        <StatCard label={t("Documents")} value={docCount} href="/documents" />
        <StatCard
          label={t("Prochaine réunion")}
          value={nextMeeting ? formatDate(nextMeeting.scheduledAt) : "—"}
          href="/reunions"
          small
        />
      </div>

      <Card className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <h2 className="text-lg font-bold text-gray-900">
            {t("Voisins en ligne")}
          </h2>
          <span className="text-sm font-normal text-gray-500">
            ({onlineUsers.length})
          </span>
        </div>
        {onlineUsers.length === 0 ? (
          <p className="text-sm text-gray-500">{t("Personne en ligne pour l'instant.")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="font-medium">
                  {u.firstName}
                  {u.lastName ? ` ${u.lastName.charAt(0).toUpperCase()}.` : ""}
                  {u.id === user.id ? ` (${t("vous")})` : ""}
                </span>
                <span className="text-gray-500">
                  ·{" "}
                  {u.unit ? t(u.unit.building.name) : t("Bâtiment non renseigné")}
                </span>
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{t("Annonces")}</h2>
            <Link
              href="/annonces"
              className="text-sm font-medium text-rose-700 hover:underline"
            >
              {t("Tout voir")}
            </Link>
          </div>
          {announcements.length === 0 ? (
            <EmptyState>{t("Aucune annonce pour le moment.")}</EmptyState>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <Card key={a.id}>
                  <div className="mb-1 flex items-center gap-2">
                    {a.pinned ? (
                      <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                        📌 Épinglée
                      </Badge>
                    ) : null}
                    <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                      {a.building ? a.building.name : "Toutes résidences"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-gray-600">
                    {a.body}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {formatDate(a.createdAt)}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {t("Derniers signalements")}
            </h2>
            <Link
              href="/incidents"
              className="text-sm font-medium text-rose-700 hover:underline"
            >
              {t("Tout voir")}
            </Link>
          </div>
          {incidents.length === 0 ? (
            <EmptyState>{t("Aucun signalement pour l'instant.")}</EmptyState>
          ) : (
            <div className="space-y-3">
              {incidents.map((i) => (
                <Link key={i.id} href={`/incidents/${i.id}`} className="block">
                  <Card className="transition hover:border-rose-200 hover:shadow">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge className={incidentStatusColors[i.status]}>
                        {incidentStatusLabels[i.status]}
                      </Badge>
                      <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                        {incidentCategoryLabels[i.category]}
                      </Badge>
                      <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                        {i.building.name}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900">{i.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDateTime(i.createdAt)}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {nextMeeting ? (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold text-gray-900">
            {t("Prochaine réunion")}
          </h2>
          <Link href={`/reunions/${nextMeeting.id}`} className="block">
            <Card className="transition hover:border-rose-200 hover:shadow">
              <h3 className="font-semibold text-gray-900">{nextMeeting.title}</h3>
              <p className="mt-1 text-sm text-gray-600">
                🗓️ {formatDateTime(nextMeeting.scheduledAt)}
                {nextMeeting.location ? ` · 📍 ${nextMeeting.location}` : ""}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {nextMeeting.building
                  ? nextMeeting.building.name
                  : "Toutes résidences"}
              </p>
            </Card>
          </Link>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  small,
}: {
  label: string;
  value: number | string;
  href: string;
  small?: boolean;
}) {
  return (
    <Link href={href} className="block">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:shadow">
        <div
          className={`font-bold text-gray-900 ${small ? "text-base" : "text-2xl"}`}
        >
          {value}
        </div>
        <div className="mt-1 text-xs font-medium text-gray-500">{label}</div>
      </div>
    </Link>
  );
}
