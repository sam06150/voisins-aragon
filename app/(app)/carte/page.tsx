import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { isStaff } from "@/lib/roles";
import { scopeFor } from "@/lib/tenancy";
import { getResidenceName } from "@/lib/settings";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import BuildingsMap from "@/components/BuildingsMap";

export default async function CartePage() {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();

  const [buildings, openByBuilding, residenceName] = await Promise.all([
    prisma.building.findMany({
      // cloisonnement par résidence
      where:
        scope.kind === "residence" ? { residenceId: scope.residenceId } : {},
      orderBy: { code: "asc" },
      include: { residence: true },
    }),
    // Signalements actifs par bâtiment (pour la carte de chaleur).
    prisma.incidentReport.groupBy({
      by: ["buildingId"],
      where: {
        status: { in: ["OUVERT", "EN_COURS"] },
        ...(scope.kind === "residence"
          ? { building: { residenceId: scope.residenceId } }
          : {}),
      },
      _count: { _all: true },
    }),
    getResidenceName(),
  ]);

  const openCountFor = (buildingId: string) =>
    openByBuilding.find((x) => x.buildingId === buildingId)?._count._all ?? 0;

  const located = buildings.filter(
    (b): b is typeof b & { latitude: number; longitude: number } =>
      b.latitude !== null && b.longitude !== null,
  );

  // Regroupement de la liste par résidence.
  const byResidence = new Map<string, typeof located>();
  for (const b of located) {
    const key = b.residence?.name ?? t("Sans résidence");
    const list = byResidence.get(key) ?? [];
    list.push(b);
    byResidence.set(key, list);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={residenceName ? `${t("Carte")} — ${residenceName}` : t("Carte des bâtiments")}
        description={t("Les bâtiments situés sur la carte, regroupés par résidence.")}
      />

      {located.length === 0 ? (
        <EmptyState>
          {t("Aucun bâtiment n'a encore d'adresse localisée.")}
          {isStaff(user.role) ? (
            <>
              {" "}
              <Link
                href="/admin/immeubles"
                className="font-medium text-rose-700 hover:underline"
              >
                {t("Ajouter les adresses")}
              </Link>
            </>
          ) : null}
        </EmptyState>
      ) : (
        <BuildingsMap
          residenceName={residenceName}
          buildings={located.map((b) => ({
            name: b.name,
            address: b.address,
            latitude: b.latitude,
            longitude: b.longitude,
            residence: b.residence?.name ?? null,
            openIncidents: openCountFor(b.id),
          }))}
        />
      )}

      {located.length > 0 ? (
        <div className="mt-4 space-y-4">
          {[...byResidence.entries()].map(([resName, list]) => (
            <Card key={resName}>
              <h2 className="mb-2 text-sm font-bold text-gray-900">
                🏢 {resName}
              </h2>
              <ul className="space-y-1 text-sm">
                {list.map((b) => {
                  const n = openCountFor(b.id);
                  return (
                    <li key={b.id} className="flex items-center gap-2 text-gray-700">
                      <span className="font-semibold">{b.name}</span>
                      {b.address ? (
                        <span className="text-gray-500"> · {b.address}</span>
                      ) : null}
                      {n > 0 ? (
                        <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                          {n} {t("actif(s)")}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
