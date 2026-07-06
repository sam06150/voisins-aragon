import { requireAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import MeetingForm from "./MeetingForm";

export default async function NouvelleReunionPage() {
  await requireAdmin();
  const { t } = await getI18n();

  const buildings = await prisma.building.findMany({
    orderBy: { code: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Nouvelle réunion")}
        description={t("Réservé aux référents du collectif.")}
      />
      <Card>
        <MeetingForm buildings={buildings} />
      </Card>
    </div>
  );
}
