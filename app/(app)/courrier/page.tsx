import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { scopeFor, buildingScopeWhere } from "@/lib/tenancy";
import { PageHeader } from "@/components/ui";
import { formatDate, incidentCategoryLabels } from "@/lib/labels";
import LetterEditor from "./LetterEditor";

export default async function CourrierPage() {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();

  const buildingId = user.unit?.buildingId ?? null;

  // Problèmes en cours à mentionner dans la lettre (bâtiment du locataire,
  // borné à sa résidence).
  const incidents = await prisma.incidentReport.findMany({
    where: {
      AND: [
        buildingScopeWhere(scope),
        {
          status: { in: ["OUVERT", "EN_COURS"] },
          ...(buildingId ? { buildingId } : {}),
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { building: true },
  });

  const senderName = `${user.firstName} ${user.lastName}`;
  const senderMeta = user.unit
    ? `${t(user.unit.building.name)} — ${t("logement")} ${user.unit.label}`
    : t("Résidence");

  const destDefault =
    "À l'attention du bailleur / gestionnaire de l'immeuble\n" +
    "[Nom du bailleur]\n[Adresse du bailleur]";

  const problemLines =
    incidents.length > 0
      ? incidents
          .map(
            (i) =>
              `- ${i.title} (${t(incidentCategoryLabels[i.category])}, ${i.building.name}, signalé le ${formatDate(i.createdAt)})`,
          )
          .join("\n")
      : "";

  const ctx = {
    senderName,
    unitLabel: user.unit ? `logement ${user.unit.label}` : null,
    problemLines,
    hasProblems: incidents.length > 0,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t("Générateur de courriers juridiques")}
        description={t(
          "Choisissez un type de courrier : il est pré-rempli avec vos informations, les problèmes en cours et la base légale. Relisez, complétez, puis imprimez ou enregistrez en PDF.",
        )}
      />
      <LetterEditor
        senderName={senderName}
        senderMeta={senderMeta}
        destDefault={destDefault}
        ctx={ctx}
      />
    </div>
  );
}
