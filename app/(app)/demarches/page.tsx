import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isManager } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { scopeFor, optionalBuildingScopeWhere, buildingsFor } from "@/lib/tenancy";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import { formatDate, landlordStepColors, landlordStepLabels } from "@/lib/labels";
import StepForm from "./StepForm";
import { deleteStep } from "./actions";

export default async function DemarchesPage() {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();
  const isAdmin = isManager(user.role);

  const [steps, buildings] = await Promise.all([
    prisma.landlordStep.findMany({
      where: optionalBuildingScopeWhere(scope), // cloisonnement par résidence
      include: {
        building: true,
        author: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { occurredAt: "desc" },
    }),
    buildingsFor(scope),
  ]);

  return (
    <div>
      <PageHeader
        title={t("Démarches face au bailleur")}
        description={t(
          "La frise des actions du collectif : courriers, relances, réponses, rendez-vous.",
        )}
      />

      {isAdmin ? (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">
            {t("Ajouter une étape")}
          </h2>
          <StepForm buildings={buildings} />
        </Card>
      ) : null}

      {steps.length === 0 ? (
        <EmptyState>{t("Aucune démarche enregistrée pour l'instant.")}</EmptyState>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-gray-200 pl-6">
          {steps.map((s) => (
            <li key={s.id} className="relative">
              <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-rose-500 ring-1 ring-rose-200" />
              <Card>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge className={landlordStepColors[s.type]}>
                    {t(landlordStepLabels[s.type])}
                  </Badge>
                  <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                    {s.building ? t(s.building.name) : t("Toutes résidences")}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDate(s.occurredAt)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                {s.detail ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                    {s.detail}
                  </p>
                ) : null}
                {isAdmin ? (
                  <div className="mt-2">
                    <form action={deleteStep}>
                      <input type="hidden" name="stepId" value={s.id} />
                      <ConfirmButton
                        variant="ghost"
                        className="px-2 py-1 text-xs"
                        confirmMessage={t("Supprimer cette étape ?")}
                      >
                        {t("Supprimer")}
                      </ConfirmButton>
                    </form>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
