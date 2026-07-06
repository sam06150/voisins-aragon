import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import IncidentForm from "./IncidentForm";

export default async function NouveauIncidentPage() {
  const user = await requireApproved();
  const { t } = await getI18n();

  const [buildings, units] = await Promise.all([
    prisma.building.findMany({
      orderBy: { code: "asc" },
      select: { id: true, name: true },
    }),
    prisma.unit.findMany({
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
