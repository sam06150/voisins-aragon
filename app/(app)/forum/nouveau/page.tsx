import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import ThreadForm from "./ThreadForm";

export default async function NouvelleDiscussionPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  await requireApproved();
  const { t } = await getI18n();
  const { categorie } = await searchParams;

  const categories = await prisma.forumCategory.findMany({
    include: { building: true },
  });

  const sorted = [...categories].sort((a, b) => {
    if (!a.building && b.building) return -1;
    if (a.building && !b.building) return 1;
    return (a.building?.code ?? "").localeCompare(b.building?.code ?? "");
  });

  const options = sorted.map((c) => ({
    id: c.id,
    name: c.name,
    isGeneral: !c.building,
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Nouvelle discussion")}
        description={t(
          "Ouvrez un sujet dans l'espace général ou celui de votre bâtiment.",
        )}
      />
      <Card>
        <ThreadForm categories={options} defaultCategoryId={categorie} />
      </Card>
    </div>
  );
}
