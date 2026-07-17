import Link from "next/link";

export const metadata = {
  title: "Mentions légales",
};

export default function MentionsLegalesPage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm leading-relaxed text-gray-700 shadow-sm">
      <h1 className="mb-4 text-lg font-bold text-gray-900">Mentions légales</h1>

      <section className="mb-4">
        <h2 className="mb-1 font-semibold text-gray-900">Éditeur</h2>
        <p>
          Plateforme « Voisins Collectif et en Colère », éditée par le collectif
          des locataires. <em>À compléter : nom du responsable, adresse,
          e-mail de contact.</em>
        </p>
      </section>

      <section className="mb-4">
        <h2 className="mb-1 font-semibold text-gray-900">Hébergement</h2>
        <p>
          Application hébergée par Render ; base de données Neon ; fichiers
          Cloudinary ; e-mails Brevo.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="mb-1 font-semibold text-gray-900">Objet</h2>
        <p>
          Espace privé réservé aux locataires d'une résidence pour s'informer,
          s'entraider et se mobiliser. L'accès est validé par un référent.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="mb-1 font-semibold text-gray-900">Données personnelles</h2>
        <p>
          Le traitement de vos données est décrit dans la{" "}
          <Link
            href="/confidentialite"
            className="text-rose-700 hover:underline"
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </section>

      <p className="mt-6 text-center">
        <Link href="/inscription" className="text-rose-700 hover:underline">
          ← Retour à l'inscription
        </Link>
      </p>
    </div>
  );
}
