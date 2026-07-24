/**
 * Modèles de courriers juridiques pour le collectif des locataires.
 *
 * Chaque modèle est une fonction pure qui reçoit le contexte (locataire,
 * problèmes en cours) et renvoie un objet { objet, corps } prêt à relire.
 * Aucun modèle ne remplace un conseil juridique : ce sont des trames types
 * fondées sur les textes courants du droit locatif français.
 */

export type LetterContext = {
  /** Nom complet du locataire, ex. "Marie Dupont". */
  senderName: string;
  /** Libellé du logement, ex. "logement B12", ou null si non renseigné. */
  unitLabel: string | null;
  /** Lignes décrivant les problèmes en cours (déjà formatées, avec tirets). */
  problemLines: string;
  /** true si au moins un problème est listé (sinon placeholder). */
  hasProblems: boolean;
};

export type LetterDraft = { objet: string; corps: string };

export type LetterTemplate = {
  id: string;
  /** Nom affiché dans le sélecteur. */
  label: string;
  /** Courte explication de quand l'utiliser. */
  hint: string;
  /** Bases légales citées, affichées sous le sélecteur. */
  legal: string;
  build: (ctx: LetterContext) => LetterDraft;
};

const locataire = (ctx: LetterContext) =>
  ctx.unitLabel ? `du ${ctx.unitLabel}` : "de la résidence";

const problemsBlock = (ctx: LetterContext) =>
  ctx.hasProblems
    ? ctx.problemLines
    : "- [Décrivez ici précisément le ou les problèmes constatés, avec dates]";

const salutations =
  "Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.";

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: "signalement",
    label: "Signalement — demande d'intervention",
    hint: "Premier courrier : alerter le bailleur et demander les réparations.",
    legal:
      "Art. 6 de la loi n°89-462 du 6 juillet 1989 (obligation de délivrance et d'entretien du bailleur).",
    build: (ctx) => ({
      objet: "Signalement de dysfonctionnements et demande d'intervention",
      corps: `Madame, Monsieur,

Locataire ${locataire(ctx)}, je me permets de vous alerter sur plusieurs dysfonctionnements qui perturbent nos conditions de vie et nécessitent votre intervention :

${problemsBlock(ctx)}

Ces problèmes, constatés par plusieurs locataires, relèvent de votre responsabilité de bailleur au titre de l'entretien du logement et des parties communes (article 6 de la loi du 6 juillet 1989).

En conséquence, je vous demande de bien vouloir faire procéder aux réparations et interventions nécessaires dans les meilleurs délais, et au plus tard sous quinze (15) jours à compter de la réception de ce courrier.

À défaut, je me réserve le droit d'engager, avec le collectif des locataires, toute démarche utile pour faire valoir nos droits.

${salutations}`,
    }),
  },
  {
    id: "mise-en-demeure",
    label: "Mise en demeure (relance après silence)",
    hint: "Le bailleur n'a pas répondu à un premier courrier : on hausse le ton.",
    legal:
      "Art. 1217 et 1344 du Code civil (mise en demeure) ; art. 6 de la loi du 6 juillet 1989.",
    build: (ctx) => ({
      objet:
        "MISE EN DEMEURE — Réalisation des travaux et réparations (LRAR)",
      corps: `Madame, Monsieur,

Par courrier précédent resté sans réponse (ou sans suite effective), je vous ai signalé les dysfonctionnements suivants affectant ${locataire(
        ctx,
      )} et les parties communes :

${problemsBlock(ctx)}

Malgré ce signalement, aucune intervention satisfaisante n'a été réalisée à ce jour.

Par la présente, je vous METS EN DEMEURE de procéder aux réparations et interventions nécessaires dans un délai de quinze (15) jours à compter de la réception de ce courrier recommandé.

À défaut d'exécution dans ce délai, je me réserve le droit, avec le collectif des locataires, de saisir la commission départementale de conciliation puis le tribunal judiciaire aux fins de vous y contraindre sous astreinte, et de solliciter une réduction de loyer ainsi que des dommages et intérêts (articles 1217 et 1344 et suivants du Code civil).

${salutations}`,
    }),
  },
  {
    id: "conciliation",
    label: "Saisine — commission départementale de conciliation",
    hint: "Étape amiable gratuite avant le tribunal, après une mise en demeure.",
    legal:
      "Art. 20 de la loi n°89-462 du 6 juillet 1989 (commission départementale de conciliation).",
    build: (ctx) => ({
      objet:
        "Saisine de la commission départementale de conciliation (CDC)",
      corps: `Madame, Monsieur le Président de la commission départementale de conciliation,

Locataire ${locataire(
        ctx,
      )}, je saisis la commission départementale de conciliation en raison d'un litige persistant avec mon bailleur, resté non résolu malgré mes démarches amiables (signalement puis mise en demeure).

Le litige porte sur les points suivants :

${problemsBlock(ctx)}

Ces manquements relèvent des obligations du bailleur au titre de la loi du 6 juillet 1989. Je sollicite la conciliation prévue à l'article 20 de cette loi afin d'obtenir la réalisation des travaux et, le cas échéant, une réduction de loyer pour la période concernée.

Je joins à la présente les pièces justificatives (copies des courriers, photographies, constats).

${salutations}`,
    }),
  },
  {
    id: "reduction-loyer",
    label: "Demande de réduction / retenue de loyer",
    hint: "Le logement est indécent ou inhabitable : demander une baisse de loyer.",
    legal:
      "Art. 6 et 20-1 de la loi du 6 juillet 1989 ; décret n°2002-120 (logement décent).",
    build: (ctx) => ({
      objet: "Demande de réduction de loyer pour non-décence du logement",
      corps: `Madame, Monsieur,

Locataire ${locataire(
        ctx,
      )}, je constate que le logement et les parties communes ne répondent plus aux caractéristiques d'un logement décent, en raison des désordres suivants :

${problemsBlock(ctx)}

Ces désordres, dont vous avez été informé et qui perdurent, portent atteinte à la jouissance paisible des lieux et aux normes de décence (décret n°2002-120 du 30 janvier 2002 ; article 6 de la loi du 6 juillet 1989).

En conséquence, je vous demande :
1. de réaliser sans délai les travaux de mise en conformité ;
2. d'accorder une réduction de loyer proportionnée à la période et à la gravité des désordres.

À défaut d'accord, je saisirai la commission départementale de conciliation puis le tribunal judiciaire, qui peut ordonner les travaux sous astreinte et fixer lui-même la réduction de loyer (article 20-1 de la loi du 6 juillet 1989).

${salutations}`,
    }),
  },
  {
    id: "mairie",
    label: "Signalement à la mairie (péril / insalubrité)",
    hint: "Danger pour la sécurité ou la santé : alerter le service d'hygiène.",
    legal:
      "Art. L.511-1 et s. du Code de la construction et de l'habitation (police de la sécurité et de la salubrité).",
    build: (ctx) => ({
      objet:
        "Signalement d'un logement / immeuble présentant un risque pour la sécurité ou la santé",
      corps: `Madame, Monsieur le Maire,

En qualité de locataire ${locataire(
        ctx,
      )}, je porte à votre connaissance des désordres qui présentent un risque pour la sécurité et/ou la santé des occupants de l'immeuble :

${problemsBlock(ctx)}

Malgré nos signalements au bailleur, la situation n'a pas été traitée. Je sollicite l'intervention du service communal d'hygiène et de santé (ou du service compétent) afin qu'un contrôle soit diligenté et, le cas échéant, qu'une procédure au titre de la police de la sécurité et de la salubrité des immeubles soit engagée (articles L.511-1 et suivants du Code de la construction et de l'habitation).

Je me tiens à votre disposition pour faciliter la visite et fournir toute pièce utile (photographies, courriers adressés au bailleur).

Je vous prie d'agréer, Madame, Monsieur le Maire, l'expression de ma haute considération.`,
    }),
  },
  {
    id: "collectif",
    label: "Courrier collectif des locataires",
    hint: "Signé par plusieurs locataires pour peser davantage.",
    legal:
      "Loi du 6 juillet 1989 ; loi n°86-1290 du 23 décembre 1986 (association de locataires).",
    build: (ctx) => ({
      objet:
        "Courrier collectif des locataires — demande d'intervention et de rencontre",
      corps: `Madame, Monsieur,

Nous, locataires soussignés de la résidence, vous adressons ce courrier collectif pour vous alerter sur des dysfonctionnements qui affectent l'ensemble des occupants :

${problemsBlock(ctx)}

Ces problèmes durent et concernent de nombreux logements. Ils relèvent de vos obligations d'entretien du bâti et des parties communes (loi du 6 juillet 1989).

Nous vous demandons :
1. un calendrier écrit et daté des interventions ;
2. une réunion sur place avec un représentant du collectif dans un délai de quinze (15) jours.

À défaut de réponse, nous engagerons collectivement les démarches utiles (conciliation, saisine des autorités compétentes, action en justice).

Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

Signatures des locataires :

Nom / Logement / Signature
............................................
............................................
............................................
............................................`,
    }),
  },
];

export function getTemplate(id: string): LetterTemplate {
  return LETTER_TEMPLATES.find((m) => m.id === id) ?? LETTER_TEMPLATES[0];
}
