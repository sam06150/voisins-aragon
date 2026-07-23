import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { Alert, Button, Card } from "@/components/ui";
import { formatDateTime } from "@/lib/labels";
import { acceptModeratorCharter } from "./actions";

/** Les 6 engagements — miroir de CHARTE-MODERATEUR.md et de la page /referent. */
const ENGAGEMENTS: { title: string; body: string }[] = [
  {
    title: "Protéger les données de mes voisins",
    body: "Je ne diffuse aucune donnée personnelle d'un locataire en dehors de la plateforme, et jamais au bailleur.",
  },
  {
    title: "M'en tenir aux faits",
    body: "Je fais signaler des problèmes constatés et datés. Je n'accuse jamais nommément une personne sans preuve.",
  },
  {
    title: "Modérer sans arbitraire",
    body: "Je supprime les insultes et le hors-sujet, jamais un message au seul motif qu'il me déplaît ou critique mon action.",
  },
  {
    title: "Vérifier les inscriptions",
    body: "Je ne valide un compte que si j'ai un motif raisonnable de croire que la personne habite la résidence.",
  },
  {
    title: "Rester dans la légalité",
    body: "Je n'utilise pas la plateforme pour organiser une action illégale ; je m'oriente vers les recours légaux.",
  },
  {
    title: "Passer la main proprement",
    body: "Si je ne peux plus tenir le rôle, je préviens et je transmets plutôt que de laisser l'espace à l'abandon.",
  },
];

export default async function CharteReferentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireStaff();
  const { t } = await getI18n();
  const { error } = await searchParams;
  const already = user.moderatorCharterAt;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">
        {t("Charte du référent")}
      </h1>
      <p className="mb-5 text-sm text-gray-600">
        {t(
          "L'accès à l'espace d'administration suppose d'accepter cette charte. Elle protège vos voisins — et vous.",
        )}
      </p>

      {already ? (
        <div className="mb-4">
          <Alert kind="success">
            {t("Vous avez accepté la charte le")} {formatDateTime(already)}.
          </Alert>
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <Alert kind="error">
            {t("Vous devez cocher la case pour accéder à l'espace d'administration.")}
          </Alert>
        </div>
      ) : null}

      <Card>
        <ol className="space-y-3">
          {ENGAGEMENTS.map((e, i) => (
            <li key={e.title} className="flex gap-3">
              <span className="font-black text-rose-600">{i + 1}.</span>
              <span className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">{t(e.title)}</span>
                {" — "}
                {t(e.body)}
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
          {t(
            "Manquement : le non-respect de cette charte peut entraîner le retrait des droits de modération. Le référent agit bénévolement et ne représente pas juridiquement les locataires.",
          )}
        </p>

        {already ? (
          <div className="mt-5">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              {t("Accéder à l'administration")}
            </Link>
          </div>
        ) : (
          <form action={acceptModeratorCharter} className="mt-5 space-y-4">
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="accept"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
              />
              <span>
                {t("J'ai lu et j'accepte la charte du référent.")}
              </span>
            </label>
            <Button type="submit">{t("Valider et continuer")}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
