import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { scopeFor, buildingsFor } from "@/lib/tenancy";
import { Card, PageHeader } from "@/components/ui";
import PetitionForm from "./PetitionForm";

export default async function NouvellePetitionPage() {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();

  const buildings = await buildingsFor(scope);

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
