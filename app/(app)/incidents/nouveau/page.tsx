import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { scopeFor, buildingScopeWhere, buildingsFor } from "@/lib/tenancy";
import { Card, PageHeader } from "@/components/ui";
import IncidentForm from "./IncidentForm";

export default async function NouveauIncidentPage() {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();

  const [buildings, units] = await Promise.all([
    buildingsFor(scope),
    prisma.unit.findMany({
      where: buildingScopeWhere(scope), // logements de la résidence uniquement
      orderBy: [{ floor: "asc" }, { label: "asc" }],
      select: { id: true, label: true, floor: true, buildingId: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Nouveau signalement")}
        description={t(
          "Décrivez le problème le plus précisément possible. Tous les locataires connectés pourront le consulter.",
        )}
      />
      <Card>
        <IncidentForm
          buildings={buildings}
          units={units}
          defaultBuildingId={user.unit?.buildingId}
        />
      </Card>
    </div>
  );
}
