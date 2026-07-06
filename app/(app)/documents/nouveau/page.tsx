import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import DocumentForm from "./DocumentForm";

export default async function NouveauDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ reunion?: string }>;
}) {
  await requireApproved();
  const { t } = await getI18n();
  const { reunion } = await searchParams;

  const buildings = await prisma.building.findMany({
    orderBy: { code: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Ajouter un document")}
        description={t(
          "Partagez un modèle de lettre, une pétition, un justificatif ou un compte-rendu avec le collectif.",
        )}
      />
      <Card>
        <DocumentForm buildings={buildings} meetingId={reunion} />
      </Card>
    </div>
  );
}
