import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité",
};

export default function ConfidentialitePage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm leading-relaxed text-gray-700 shadow-sm">
      <h1 className="mb-1 text-lg font-bold text-gray-900">
        Politique de confidentialité
      </h1>
      <p className="mb-4 text-xs text-gray-500">
        Plateforme « Voisins Collectif et en Colère ». Dernière mise à jour :
        23 juillet 2026.
      </p>

      <Section title="1. Responsable du traitement">
        La plateforme est gérée par le collectif des locataires
        {" "}
        {/* Une fois l'association créée, remplacer par : « par l'association … (loi 1901), … ». */}
        (en cours de constitution en association loi 1901). Pour toute question
        relative à vos données, ou pour exercer vos droits, écrivez à{" "}
        <a
          href="mailto:sdsb.2023@gmail.com"
          className="text-rose-700 hover:underline"
        >
          sdsb.2023@gmail.com
        </a>
        .
      </Section>

      <Section title="2. Données que nous collectons">
        <ul className="list-disc space-y-1 pl-5">
          <li>Identité : prénom, nom.</li>
          <li>Contact : adresse e-mail, téléphone (facultatif).</li>
          <li>
            Logement déclaré : résidence, bâtiment, étage / appartement.
          </li>
          <li>
            Contenus que vous publiez : signalements (et photos), messages du
            forum, messages privés, pétitions, votes, entraide, présence aux
            réunions.
          </li>
          <li>
            Données techniques : mot de passe (stocké de façon chiffrée), date
            de dernière connexion, préférences de partage et de notifications.
          </li>
          <li>
            Candidature (si vous vous manifestez via « Rejoindre » ou « Devenir
            référent » sans encore avoir de compte) : prénom, nom, e-mail,
            téléphone facultatif, ville, code postal, pays, bailleur, résidence
            et message éventuels. Ces informations servent uniquement à vous
            recontacter pour ouvrir l'espace de votre résidence et ne sont
            jamais transmises au bailleur.
          </li>
        </ul>
      </Section>

      <Section title="3. Finalités et bases légales">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Faire fonctionner la plateforme du collectif et vous authentifier
            (exécution du service auquel vous adhérez).
          </li>
          <li>
            Vous notifier (in-app, e-mail, notifications push) — vous pouvez
            désactiver les e-mails dans « Mon compte » (intérêt légitime /
            consentement).
          </li>
          <li>
            Réserver l'accès aux locataires (vérification par un référent).
          </li>
          <li>
            Traiter les candidatures reçues via « Rejoindre » / « Devenir
            référent » et ouvrir l'espace d'une résidence (mesures prises à
            votre demande, préalables à l'adhésion au service).
          </li>
        </ul>
      </Section>

      <Section title="4. Qui a accès à vos données">
        Vos coordonnées ne sont visibles des autres locataires que si vous
        l'activez explicitement dans « Mes préférences de partage » (rien n'est
        partagé par défaut). Les référents du collectif accèdent aux données
        nécessaires à la gestion des comptes.
      </Section>

      <Section title="5. Sous-traitants / hébergement">
        <ul className="list-disc space-y-1 pl-5">
          <li>Hébergement de l'application : Render.</li>
          <li>Base de données : Neon (PostgreSQL).</li>
          <li>
            Stockage des fichiers (photos, documents) : Cloudinary — un
            transfert hors Union européenne est possible.
          </li>
          <li>Envoi des e-mails : Brevo.</li>
        </ul>
        <p className="mt-1">
          Nous veillons à ce que ces prestataires présentent des garanties
          adéquates ; lorsqu'un transfert hors Union européenne a lieu
          (Cloudinary), il est encadré par les clauses contractuelles types de
          la Commission européenne.
        </p>
      </Section>

      <Section title="6. Durées de conservation">
        <ul className="list-disc space-y-1 pl-5">
          <li>Compte actif : tant que votre compte existe.</li>
          <li>Compte en attente ou refusé : supprimé au bout de 12 mois.</li>
          <li>Compte inactif : anonymisé 3 ans après la dernière connexion.</li>
          <li>
            Candidature non transformée en compte : supprimée au bout de
            12 mois.
          </li>
          <li>Sauvegardes : conservées 12 mois au maximum.</li>
        </ul>
        <p className="mt-1">
          Un compte supprimé est anonymisé ; les contributions collectives
          (forum, signalements) sont conservées de façon anonyme.
        </p>
      </Section>

      <Section title="7. Vos droits">
        Vous disposez des droits d'accès, de rectification, d'effacement,
        d'opposition, de limitation et de portabilité de vos données. Vous
        pouvez exporter vos données ou demander la suppression de votre compte
        depuis « Mon compte », ou en écrivant au référent. Vous pouvez aussi
        saisir la CNIL (
        <a
          href="https://www.cnil.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-rose-700 hover:underline"
        >
          cnil.fr
        </a>
        ).
      </Section>

      <Section title="8. Cookies">
        La plateforme utilise uniquement un cookie de session, strictement
        nécessaire pour vous maintenir connecté. Aucun cookie publicitaire ni
        de mesure d'audience tiers.
      </Section>

      <p className="mt-6 text-center">
        <Link href="/inscription" className="text-rose-700 hover:underline">
          ← Retour à l'inscription
        </Link>
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4">
      <h2 className="mb-1 font-semibold text-gray-900">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
