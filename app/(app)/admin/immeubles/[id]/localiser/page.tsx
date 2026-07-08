import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import LocationPicker from "./LocationPicker";

export default async function LocaliserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireManager();
  const { t } = await getI18n();
  const { id } = await params;

  const building = await prisma.building.findUnique({ where: { id } });
  if (!building) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/immeubles"
        className="mb-4 inline-block text-sm text-gray-500 hover:underline"
      >
        ← {t("Retour aux bâtiments")}
      </Link>
      <PageHeader
        title={`${t("Situer")} — ${t(building.name)}`}
        description={t(
          "Cherchez l'adresse, puis placez le repère précisément sur le bâtiment. C'est plus fiable qu'une simple adresse.",
        )}
      />
      <Card>
        <LocationPicker
          buildingId={building.id}
          initialAddress={building.address ?? ""}
          initialLat={building.latitude}
          initialLng={building.longitude}
        />
      </Card>
    </div>
  );
}
