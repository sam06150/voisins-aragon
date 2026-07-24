import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import {
  scopeFor,
  buildingScopeWhere,
  optionalBuildingScopeWhere,
  userScopeWhere,
  buildingsFor,
} from "@/lib/tenancy";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import {
  incidentCategoryLabels,
  incidentStatusLabels,
} from "@/lib/labels";
import type { IncidentCategory, IncidentStatus } from "@prisma/client";

function Bar({
  label,
  value,
  max,
  color = "bg-rose-500",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label} : ${value}`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export default async function StatistiquesPage() {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();

  const buildings = await buildingsFor(scope);
  const incidentWhere = buildingScopeWhere(scope); // cloisonnement résidence
  const scopeWhere = optionalBuildingScopeWhere(scope);

  const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    byBuilding,
    byCategory,
    byStatus,
    totalIncidents,
    totalUsers,
    totalPetitions,
    totalSignatures,
    totalThreads,
    totalPosts,
    resolvedIncidents,
    ignoredIncidents,
    totalSupports,
    uniqueSigners,
    uniqueVoters,
  ] = await Promise.all([
    prisma.incidentReport.groupBy({
      by: ["buildingId"],
      where: incidentWhere,
      _count: { _all: true },
    }),
    prisma.incidentReport.groupBy({
      by: ["category"],
      where: incidentWhere,
      _count: { _all: true },
    }),
    prisma.incidentReport.groupBy({
      by: ["status"],
      where: incidentWhere,
      _count: { _all: true },
    }),
    prisma.incidentReport.count({ where: incidentWhere }),
    prisma.user.count({
      where: { ...userScopeWhere(scope), status: "APPROVED" },
    }),
    prisma.petition.count({ where: scopeWhere }),
    prisma.petitionSignature.count({ where: { petition: scopeWhere } }),
    prisma.forumThread.count({ where: { category: scopeWhere } }),
    prisma.forumPost.count({ where: { thread: { category: scopeWhere } } }),
    // Incidents résolus/clos, avec dates pour calculer le délai moyen.
    prisma.incidentReport.findMany({
      where: { AND: [incidentWhere, { status: { in: ["RESOLU", "CLOS"] } }] },
      select: { createdAt: true, updatedAt: true },
    }),
    // Incidents "ignorés" : encore ouverts et vieux de plus de 30 jours.
    prisma.incidentReport.count({
      where: {
        AND: [
          incidentWhere,
          { status: { in: ["OUVERT", "EN_COURS"] } },
          { createdAt: { lt: THIRTY_DAYS_AGO } },
        ],
      },
    }),
    prisma.incidentSupport.count({
      where: { incident: incidentWhere },
    }),
    // Mobilisation : nombre de locataires distincts qui ont signé ou voté.
    prisma.petitionSignature.findMany({
      where: { petition: scopeWhere },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.pollVote.findMany({
      where: { poll: scopeWhere },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  // --- Indicateurs "rapport de force" (calculés, sans changement de schéma) ---
  const closedCount = resolvedIncidents.length;
  const resolutionRate =
    totalIncidents > 0 ? Math.round((closedCount / totalIncidents) * 100) : 0;

  const avgResolutionDays =
    closedCount > 0
      ? Math.round(
          resolvedIncidents.reduce(
            (sum, i) =>
              sum +
              (i.updatedAt.getTime() - i.createdAt.getTime()) /
                (24 * 60 * 60 * 1000),
            0,
          ) / closedCount,
        )
      : null;

  const mobilizedCount = new Set([
    ...uniqueSigners.map((s) => s.userId),
    ...uniqueVoters.map((v) => v.userId),
  ]).size;
  const mobilizationRate =
    totalUsers > 0 ? Math.round((mobilizedCount / totalUsers) * 100) : 0;

  const buildingCounts = buildings.map((b) => ({
    label: t(b.name),
    value: byBuilding.find((x) => x.buildingId === b.id)?._count._all ?? 0,
  }));
  const maxBuilding = Math.max(1, ...buildingCounts.map((c) => c.value));

  const categoryCounts = (
    Object.keys(incidentCategoryLabels) as IncidentCategory[]
  ).map((c) => ({
    label: t(incidentCategoryLabels[c]),
    value: byCategory.find((x) => x.category === c)?._count._all ?? 0,
  }));
  const maxCategory = Math.max(1, ...categoryCounts.map((c) => c.value));

  const statusCounts = (
    Object.keys(incidentStatusLabels) as IncidentStatus[]
  ).map((s) => ({
    label: t(incidentStatusLabels[s]),
    value: byStatus.find((x) => x.status === s)?._count._all ?? 0,
  }));
  const maxStatus = Math.max(1, ...statusCounts.map((c) => c.value));

  return (
    <div>
      <PageHeader
        title={t("Statistiques")}
        description={t(
          "Les chiffres du collectif — utiles pour appuyer les revendications.",
        )}
      />

      {/* Rapport de force : indicateurs de pression et de mobilisation */}
      <section className="mb-8" aria-label={t("Rapport de force")}>
        <h2 className="mb-3 text-lg font-bold text-gray-900">
          ⚖️ {t("Rapport de force")}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ForceCard
            label={t("Taux de résolution")}
            value={`${resolutionRate}%`}
            hint={t("Signalements résolus ou clos sur le total.")}
            tone={resolutionRate >= 50 ? "good" : "bad"}
          />
          <ForceCard
            label={t("Signalements ignorés")}
            value={ignoredIncidents}
            hint={t("Toujours ouverts après plus de 30 jours.")}
            tone={ignoredIncidents > 0 ? "bad" : "good"}
          />
          <ForceCard
            label={t("Délai moyen de résolution")}
            value={
              avgResolutionDays === null
                ? "—"
                : `${avgResolutionDays} ${t("j")}`
            }
            hint={t("Entre le signalement et sa résolution.")}
            tone="neutral"
          />
          <ForceCard
            label={t("Locataires mobilisés")}
            value={`${mobilizedCount} · ${mobilizationRate}%`}
            hint={t("Ont signé une pétition ou voté à un sondage.")}
            tone={mobilizationRate >= 30 ? "good" : "neutral"}
          />
        </div>
        <p className="mt-3 text-sm text-gray-600">
          {t("Soutiens exprimés sur les signalements")} :{" "}
          <span className="font-semibold text-gray-900">{totalSupports}</span>
        </p>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={t("Locataires")} value={totalUsers} />
        <Stat label={t("Signalements")} value={totalIncidents} />
        <Stat label={t("Pétitions")} value={totalPetitions} />
        <Stat label={t("Signatures")} value={totalSignatures} />
        <Stat label={t("Discussions")} value={totalThreads} />
        <Stat label={t("Messages forum")} value={totalPosts} />
      </div>

      {totalIncidents === 0 ? (
        <EmptyState>
          {t("Pas encore de signalement : les graphiques apparaîtront ici.")}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <h2 className="mb-4 font-bold text-gray-900">
              {t("Signalements par bâtiment")}
            </h2>
            <div className="space-y-3">
              {buildingCounts.map((c) => (
                <Bar key={c.label} {...c} max={maxBuilding} />
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-bold text-gray-900">{t("Par catégorie")}</h2>
            <div className="space-y-3">
              {categoryCounts.map((c) => (
                <Bar
                  key={c.label}
                  {...c}
                  max={maxCategory}
                  color="bg-amber-500"
                />
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-bold text-gray-900">{t("Par statut")}</h2>
            <div className="space-y-3">
              {statusCounts.map((c) => (
                <Bar key={c.label} {...c} max={maxStatus} color="bg-blue-500" />
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ForceCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: "good" | "bad" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "border-green-200 bg-green-50"
      : tone === "bad"
        ? "border-rose-200 bg-rose-50"
        : "border-gray-200 bg-white";
  const valueClass =
    tone === "good"
      ? "text-green-700"
      : tone === "bad"
        ? "text-rose-700"
        : "text-gray-900";
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      <div className="mt-1 text-sm font-semibold text-gray-800">{label}</div>
      <div className="mt-0.5 text-xs text-gray-600">{hint}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-xs font-medium text-gray-500">{label}</div>
    </div>
  );
}
