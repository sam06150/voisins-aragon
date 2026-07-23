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

  const objetDefault =
    "Signalement de dysfonctionnements et demande d'intervention";

  const problemLines =
    incidents.length > 0
      ? incidents
          .map(
            (i) =>
              `- ${i.title} (${t(incidentCategoryLabels[i.category])}, ${i.building.name}, signalé le ${formatDate(i.createdAt)})`,
          )
          .join("\n")
      : "- [Décrivez ici le ou les problèmes constatés]";

  const corpsDefault = `Madame, Monsieur,

Locataire ${
    user.unit ? `du logement ${user.unit.label}` : "de la résidence"
  }, je me permets de vous alerter sur plusieurs dysfonctionnements qui perturbent nos conditions de vie et nécessitent votre intervention :

${problemLines}

Ces problèmes, constatés par plusieurs locataires, relèvent de votre responsabilité de bailleur au titre de l'entretien du logement et des parties communes (article 6 de la loi du 6 juillet 1989).

En conséquence, je vous demande de bien vouloir faire procéder aux réparations et interventions nécessaires dans les meilleurs délais, et au plus tard sous quinze (15) jours à compter de la réception de ce courrier.

À défaut, je me réserve le droit d'engager, avec le collectif des locataires, toute démarche utile pour faire valoir nos droits.

Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t("Lettre au bailleur")}
        description={t(
          "Une lettre pré-remplie avec vos informations et les problèmes en cours. Relisez, complétez l'adresse du bailleur, puis imprimez ou enregistrez en PDF.",
        )}
      />
      <LetterEditor
        senderName={senderName}
        senderMeta={senderMeta}
        destDefault={destDefault}
        objetDefault={objetDefault}
        corpsDefault={corpsDefault}
      />
    </div>
  );
}
