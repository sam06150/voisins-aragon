import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import PollForm from "./PollForm";

export default async function NouveauSondagePage() {
  await requireApproved();
  const { t } = await getI18n();

  const buildings = await prisma.building.findMany({
    orderBy: { code: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Créer un sondage")}
        description={t(
          "Chaque locataire pourra voter une fois (et changer son vote tant que le sondage est ouvert).",
        )}
      />
      <Card>
        <PollForm buildings={buildings} />
      </Card>
    </div>
  );
}
