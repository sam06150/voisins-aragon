import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { scopeFor, buildingsFor } from "@/lib/tenancy";
import { Card, PageHeader } from "@/components/ui";
import PollForm from "./PollForm";

export default async function NouveauSondagePage() {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();

  const buildings = await buildingsFor(scope);

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
