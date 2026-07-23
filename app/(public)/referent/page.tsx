import type { Metadata } from "next";
import Link from "next/link";
import JoinForm from "@/components/JoinForm";

export const metadata: Metadata = {
  title: "Devenir référent de mon bâtiment — Voisins Unis",
  description:
    "On cherche une personne par bâtiment pour ouvrir l'espace des locataires. 10 minutes par semaine, bénévole, sans responsabilité juridique.",
};

export default function ReferentPage() {
  return (
    <>
      <section className="bg-gray-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
            Appel à référents
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            On cherche{" "}
            <span className="text-amber-300">une personne par bâtiment.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-200">
            Pas un chef de bloc. Un référent : quelqu&apos;un qui ouvre
            l&apos;espace de sa résidence, vérifie que les inscrits habitent
            bien là, et laisse ensuite les voisins s&apos;organiser.
          </p>
          <p className="mt-4 max-w-2xl rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-base text-amber-100">
            <strong>Sans référent, un bâtiment ne s&apos;ouvre pas.</strong>{" "}
            C&apos;est la seule chose qui bloque aujourd&apos;hui.
          </p>
          <a
            href="#formulaire"
            className="mt-8 inline-flex rounded-lg bg-amber-400 px-6 py-3 text-base font-bold text-gray-900 shadow-lg transition hover:bg-amber-300"
          >
            Je me propose
          </a>
        </div>
      </section>

      {/* Le rôle en clair */}
      <section className="mx-auto max-w-4xl px-4 py-14">
        <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
          Concrètement, vous faites quoi ?
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {DUTIES.map((d, i) => (
            <div
              key={d.title}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="text-2xl font-black text-rose-600">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-1 text-base font-bold text-gray-900">
                {d.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                {d.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <h3 className="text-sm font-bold text-green-900">
              Ce que le rôle EST
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-green-900">
              <li>· ~10 minutes par semaine</li>
              <li>· Bénévole</li>
              <li>· Réversible : vous passez la main quand vous voulez</li>
              <li>· Partageable : plusieurs référents par résidence possible</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-300 bg-gray-50 p-5">
            <h3 className="text-sm font-bold text-gray-900">
              Ce que le rôle N&apos;EST PAS
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
              <li>· Pas un porte-parole officiel</li>
              <li>· Pas un mandat juridique : vous ne représentez personne</li>
              <li>· Pas de gestion d&apos;argent</li>
              <li>· Pas d&apos;obligation de résultat face au bailleur</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Le rappel essentiel : les locataires aussi */}
      <section className="border-y border-gray-200 bg-rose-50">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="text-2xl font-black text-gray-900">
            Un référent seul ne pèse rien.
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
            Ouvrir l&apos;espace, c&apos;est l&apos;étape 1. L&apos;étape 2,
            c&apos;est que{" "}
            <strong className="text-gray-900">
              vos voisins s&apos;inscrivent eux aussi
            </strong>
            . Un bailleur peut ignorer une personne qui se plaint ; il ne peut
            pas ignorer 40 signalements horodatés sur le même problème, ni une
            pétition signée par la moitié de la résidence.
          </p>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
            Dès que votre espace est ouvert, votre première mission est simple :
            imprimer l&apos;affiche, la coller dans le hall, et faire inscrire
            un maximum de locataires. C&apos;est le nombre qui fait la pression.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/affiche"
              className="inline-flex rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
            >
              Voir l&apos;affiche à imprimer
            </Link>
            <Link
              href="/rejoindre#formulaire"
              className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
            >
              Je préfère m&apos;inscrire comme simple locataire
            </Link>
          </div>
        </div>
      </section>

      {/* Charte */}
      <section className="mx-auto max-w-4xl px-4 py-14">
        <h2 className="text-2xl font-black text-gray-900">
          La charte du référent
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          En vous proposant, vous vous engagez sur ces quatre points. Ils
          protègent les voisins, et ils vous protègent vous.
        </p>
        <ol className="mt-6 space-y-3">
          {CHARTER.map((c, i) => (
            <li
              key={c}
              className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700"
            >
              <span className="font-black text-rose-600">{i + 1}.</span>
              <span>{c}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Formulaire */}
      <section id="formulaire" className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-14">
          <h2 className="text-2xl font-black text-gray-900">
            Proposer ma candidature
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            On vous répond par e-mail pour créer l&apos;espace de votre
            résidence et vous donner les accès de modération.
          </p>
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <JoinForm defaultKind="REFERENT" lockKind />
          </div>
        </div>
      </section>
    </>
  );
}

const DUTIES = [
  {
    title: "Vous validez les inscriptions",
    desc: "Un inconnu demande à rejoindre ? Vous confirmez qu'il habite bien la résidence. C'est ce qui garde l'espace privé — et le bailleur dehors.",
  },
  {
    title: "Vous triez les signalements",
    desc: "Vous rangez, vous fusionnez les doublons, vous passez un problème en « résolu » quand c'est réglé.",
  },
  {
    title: "Vous gardez le forum lisible",
    desc: "Vous supprimez les insultes et les règlements de comptes personnels. Le reste, vous laissez vivre.",
  },
  {
    title: "Vous faites connaître l'espace",
    desc: "Affiche dans le hall, bouche-à-oreille, boîtes aux lettres. Plus il y a d'inscrits, plus le collectif pèse.",
  },
];

const CHARTER = [
  "Je ne diffuse aucune donnée personnelle d'un voisin en dehors de la plateforme, et jamais au bailleur.",
  "Je m'en tiens aux faits : je fais signaler des problèmes constatés, jamais d'accusation nominative non prouvée.",
  "Je ne modère pas selon mes opinions : je supprime les insultes et le hors-sujet, pas les avis qui me déplaisent.",
  "Si je ne peux plus tenir le rôle, je préviens et je passe la main plutôt que de laisser l'espace à l'abandon.",
];
