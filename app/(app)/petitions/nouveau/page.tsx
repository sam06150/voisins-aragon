import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import PetitionForm from "./PetitionForm";

export default async function NouvellePetitionPage() {
  await requireApproved();
  const { t } = await getI18n();

  const buildings = await prisma.building.findMany({
    orderBy: { code: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Lancer une pétition")}
        description={t("Vous signez automatiquement votre propre pétition.")}
      />
      <Card>
        <PetitionForm buildings={buildings} />
      </Card>
    </div>
  );
}
