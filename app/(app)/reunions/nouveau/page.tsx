import { requireAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { scopeFor, buildingsFor } from "@/lib/tenancy";
import { Card, PageHeader } from "@/components/ui";
import MeetingForm from "./MeetingForm";

export default async function NouvelleReunionPage() {
  const user = await requireAdmin();
  const scope = scopeFor(user);
  const { t } = await getI18n();

  const buildings = await buildingsFor(scope);

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
