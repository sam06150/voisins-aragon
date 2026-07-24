import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { scopeFor, buildingScopeWhere, buildingsFor } from "@/lib/tenancy";
import type { IncidentStatus } from "@prisma/client";
import { Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import {
  formatDateTime,
  incidentCategoryLabels,
  incidentStatusColors,
  incidentStatusLabels,
} from "@/lib/labels";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "OUVERT", label: "Ouverts" },
  { value: "EN_COURS", label: "En cours" },
  { value: "RESOLU", label: "Résolus" },
  { value: "CLOS", label: "Clos" },
];

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; batiment?: string }>;
}) {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();
  const { statut, batiment } = await searchParams;

  const buildings = await buildingsFor(scope);

  const statusFilter =
    statut && statut !== "tous" ? (statut as IncidentStatus) : null;
  const buildingFilter = batiment && batiment !== "tous" ? batiment : null;

  const incidents = await prisma.incidentReport.findMany({
    where: {
      ...buildingScopeWhere(scope), // cloisonnement par résidence
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(buildingFilter ? { buildingId: buildingFilter } : {}),
    },
    include: {
      building: true,
      unit: true,
      author: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { photos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  function buildHref(next: { statut?: string; batiment?: string }) {
    const params = new URLSearchParams();
    const s = next.statut ?? statut;
    const b = next.batiment ?? batiment;
    if (s && s !== "tous") params.set("statut", s);
    if (b && b !== "tous") params.set("batiment", b);
    const qs = params.toString();
    return qs ? `/incidents?${qs}` : "/incidents";
  }

  return (
    <div>
      <PageHeader
        title={t("Signalements")}
        description={t(
          "Pannes, dégradations, litiges avec le bailleur… Signalez et suivez les problèmes collectivement.",
        )}
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/incidents/dossier" variant="secondary">
              📄 {t("Dossier PDF")}
            </LinkButton>
            <LinkButton href="/incidents/nouveau">
              + {t("Nouveau signalement")}
            </LinkButton>
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value}
            href={buildHref({ statut: f.value })}
            label={t(f.label)}
            active={(statut ?? "tous") === f.value}
          />
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Chip
          href={buildHref({ batiment: "tous" })}
          label={t("Tous bâtiments")}
          active={!buildingFilter}
        />
        {buildings.map((b) => (
          <Chip
            key={b.id}
            href={buildHref({ batiment: b.id })}
            label={t(b.name)}
            active={buildingFilter === b.id}
          />
        ))}
      </div>

      {incidents.length === 0 ? (
        <EmptyState>{t("Aucun signalement ne correspond à ces filtres.")}</EmptyState>
      ) : (
        <div className="space-y-3">
          {incidents.map((i) => (
            <Link key={i.id} href={`/incidents/${i.id}`} className="block">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:shadow">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className={incidentStatusColors[i.status]}>
                    {t(incidentStatusLabels[i.status])}
                  </Badge>
                  <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                    {t(incidentCategoryLabels[i.category])}
                  </Badge>
                  <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                    {t(i.building.name)}
                    {i.unit ? ` · ${i.unit.label}` : ""}
                  </Badge>
                  {i._count.photos > 0 ? (
                    <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                      📎 {i._count.photos}
                    </Badge>
                  ) : null}
                </div>
                <h3 className="font-semibold text-gray-900">{i.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                  {i.description}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {t("Par")}{" "}
                  {i.anonymous
                    ? `🕶️ ${t("Anonyme")}`
                    : `${i.author.firstName} ${i.author.lastName}`}{" "}
                  · {formatDateTime(i.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "border-rose-300 bg-rose-600 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}
