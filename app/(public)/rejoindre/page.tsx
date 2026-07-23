import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import JoinForm from "@/components/JoinForm";

export const metadata: Metadata = {
  title: "Voisins Unis — Ensemble, on pèse plus lourd",
  description:
    "La plateforme privée des locataires : signalements horodatés, pétitions, preuves et pression collective face au bailleur. Rejoignez votre résidence ou ouvrez-la.",
};

export const dynamic = "force-dynamic";

/**
 * Compteurs réels — jamais de chiffres inventés sur une page publique.
 *
 * Cette page est la destination des campagnes : si la base est indisponible,
 * elle doit quand même s'afficher et laisser le formulaire accessible. On
 * masque donc simplement la section chiffres plutôt que de renvoyer une 500.
 */
async function getStats(): Promise<{
  residenceCount: number;
  cities: string[];
  referentRequests: number;
} | null> {
  try {
    const [residenceCount, cityRows, referentRequests] = await Promise.all([
      prisma.residence.count(),
      prisma.residence.findMany({
        where: { city: { not: null } },
        select: { city: true },
        distinct: ["city"],
        take: 50,
      }),
      prisma.joinRequest.count({ where: { kind: "REFERENT" } }),
    ]);
    return {
      residenceCount,
      cities: cityRows.map((r) => r.city).filter((c): c is string => Boolean(c)),
      referentRequests,
    };
  } catch {
    return null;
  }
}

export default async function RejoindrePage() {
  const stats = await getStats();

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-gradient-to-br from-rose-600 to-rose-800 text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-100">
            Plateforme privée des locataires
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Seul, vous êtes un dossier.
            <br />
            <span className="text-amber-300">À quarante, vous êtes un problème.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-rose-50">
            Votre bailleur a un service juridique, un service technique et des
            avocats. Vous, vous avez vos voisins — à condition d&apos;être
            réunis au même endroit, avec les mêmes preuves, au même moment.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#formulaire"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-bold text-rose-700 shadow-lg transition hover:bg-rose-50"
            >
              Rejoindre ma résidence
            </a>
            <Link
              href="/referent"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white/70 px-6 py-3 text-base font-bold text-white transition hover:bg-white/10"
            >
              Devenir référent de mon bâtiment
            </Link>
          </div>

          <p className="mt-6 text-sm text-rose-100">
            Gratuit · Réservé aux locataires · Vos données ne sont jamais
            transmises au bailleur
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Les deux rôles — le message central                               */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
          Il faut les deux. Vraiment les deux.
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-600">
          On cherche des <strong className="text-gray-900">référents</strong>
          {" — "}
          une personne par bâtiment pour ouvrir et tenir l&apos;espace. Mais un
          référent tout seul face au bailleur, c&apos;est exactement la
          situation d&apos;avant : une personne qui râle. Ce qui change la
          donne, c&apos;est que{" "}
          <strong className="text-gray-900">
            tous les locataires s&apos;inscrivent aussi
          </strong>
          . Le nombre n&apos;est pas un détail : c&apos;est l&apos;argument.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-700">
              Rôle 1 — on en cherche un par bâtiment
            </p>
            <h3 className="mt-2 text-xl font-black text-gray-900">
              Le référent
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Il ouvre l&apos;espace de la résidence, vérifie que les inscrits
              habitent bien là, trie les signalements et garde le forum propre.
              Ce n&apos;est pas un chef : c&apos;est celui qui tient la porte.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
              <li>· Environ 10 minutes par semaine</li>
              <li>· Bénévole, sans aucune responsabilité juridique</li>
              <li>· Peut passer la main à tout moment</li>
              <li className="font-semibold text-rose-800">
                · Sans lui, le bâtiment ne s&apos;ouvre pas
              </li>
            </ul>
            <Link
              href="/referent"
              className="mt-5 inline-flex rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
            >
              Je me propose comme référent
            </Link>
          </div>

          <div className="rounded-2xl border-2 border-gray-900 bg-gray-900 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Rôle 2 — on en cherche le plus possible
            </p>
            <h3 className="mt-2 text-xl font-black">Le locataire</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-200">
              Vous n&apos;avez rien à animer. Vous vous inscrivez, vous
              confirmez les problèmes que vous vivez aussi, vous signez les
              pétitions. Chaque inscription supplémentaire est une ligne de plus
              dans le dossier envoyé au bailleur.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-gray-200">
              <li>· Inscription en une minute</li>
              <li>· Vous choisissez ce que vous partagez</li>
              <li>· Un clic « moi aussi » suffit à appuyer un signalement</li>
              <li className="font-semibold text-amber-300">
                · 1 plainte s&apos;ignore, 40 plaintes se traitent
              </li>
            </ul>
            <a
              href="#formulaire"
              className="mt-5 inline-flex rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-gray-900 transition hover:bg-amber-300"
            >
              Je m&apos;inscris comme locataire
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong>Résumé&nbsp;:</strong> le référent ouvre la porte, les
          locataires font le poids. Si vous ne vous sentez pas de tenir le rôle
          de référent, inscrivez-vous quand même comme locataire — et parlez-en
          au voisin qui, lui, se sent de le faire.
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Ce que fait la plateforme                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
            Ce que vous obtenez
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <h3 className="text-sm font-bold text-gray-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-snug text-gray-600">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Couverture                                                        */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
          Où c&apos;est déjà ouvert
        </h2>
        {stats ? (
          <>
            <div className="mt-6 flex flex-wrap gap-8">
              <Stat
                value={stats.residenceCount}
                label="résidence(s) ouverte(s)"
              />
              <Stat value={stats.cities.length} label="ville(s) couverte(s)" />
              <Stat
                value={stats.referentRequests}
                label="candidature(s) de référent"
              />
            </div>
            {stats.cities.length > 0 ? (
              <p className="mt-6 text-sm text-gray-600">
                {stats.cities.join(" · ")}
              </p>
            ) : null}
          </>
        ) : null}
        <p className="mt-6 max-w-2xl text-base text-gray-700">
          Votre ville n&apos;est pas dans la liste ? C&apos;est justement pour ça
          qu&apos;on cherche des référents. Remplissez le formulaire : on ouvre
          votre résidence.
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Formulaire                                                        */}
      {/* ---------------------------------------------------------------- */}
      <section id="formulaire" className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-14">
          <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
            Rejoindre le collectif
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Locataire ou référent : dans les deux cas, c&apos;est ici. On vous
            répond par e-mail pour vous rattacher à votre résidence.
          </p>
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <JoinForm defaultKind="LOCATAIRE" />
          </div>
          <p className="mt-5 text-center text-sm text-gray-600">
            Votre résidence est déjà ouverte et vous avez reçu le lien ?{" "}
            <Link
              href="/inscription"
              className="font-semibold text-rose-700 hover:underline"
            >
              Créez directement votre compte
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="text-4xl font-black text-rose-700">{value}</div>
      <div className="mt-1 text-sm font-medium text-gray-500">{label}</div>
    </div>
  );
}

const FEATURES = [
  {
    title: "Signalements horodatés",
    desc: "Photo, date, bâtiment. Un mail se perd, un signalement daté fait preuve.",
  },
  {
    title: "Dossier PDF exportable",
    desc: "Tous les signalements d'un problème dans un seul document à envoyer en recommandé.",
  },
  {
    title: "Pétitions & sondages",
    desc: "Signez, votez, comptez-vous. Le nombre s'affiche en direct.",
  },
  {
    title: "Suivi des démarches",
    desc: "La frise de tous les courriers envoyés et des réponses (ou de leur absence).",
  },
  {
    title: "Annuaire des voisins",
    desc: "Se retrouver entre locataires — chacun choisit ce qu'il partage.",
  },
  {
    title: "Forum par bâtiment",
    desc: "Un espace général et un espace par bâtiment, modérés par le référent.",
  },
  {
    title: "Réunions & comptes-rendus",
    desc: "Convocations, confirmations de présence, minutes archivées.",
  },
  {
    title: "Entraide",
    desc: "Messagerie privée, prêt de matériel, coups de main entre voisins.",
  },
];
