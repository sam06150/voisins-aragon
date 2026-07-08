import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { isStaff } from "@/lib/roles";
import { getResidenceName } from "@/lib/settings";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import BuildingsMap from "@/components/BuildingsMap";

export default async function CartePage() {
  const user = await requireApproved();
  const { t } = await getI18n();

  const [buildings, residenceName] = await Promise.all([
    prisma.building.findMany({ orderBy: { code: "asc" } }),
    getResidenceName(),
  ]);

  const located = buildings.filter(
    (b): b is typeof b & { latitude: number; longitude: number } =>
      b.latitude !== null && b.longitude !== null,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={residenceName ? `${t("Carte")} — ${residenceName}` : t("Carte des bâtiments")}
        description={t("Les bâtiments de la résidence situés sur la carte.")}
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
          }))}
        />
      )}

      {located.length > 0 ? (
        <Card className="mt-4">
          <ul className="space-y-1 text-sm">
            {located.map((b) => (
              <li key={b.id} className="text-gray-700">
                <span className="font-semibold">{b.name}</span>
                {b.address ? (
                  <span className="text-gray-500"> · {b.address}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
