import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { Alert, Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { updateDirectoryPrefs } from "../actions";

export default async function MesPreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireApproved();
  const { t } = await getI18n();
  const { ok, error } = await searchParams;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={t("Mes préférences de partage")}
        description={t(
          "Vous décidez de ce qui apparaît dans l'annuaire des voisins. Rien n'est partagé par défaut.",
        )}
      />

      {ok ? (
        <div className="mb-4">
          <Alert kind="success">{t("Vos préférences ont été enregistrées.")}</Alert>
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <Alert kind="error">{t("Une erreur est survenue, réessayez.")}</Alert>
        </div>
      ) : null}

      <Card>
        <form action={updateDirectoryPrefs} className="space-y-5">
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-800">
                {user.firstName} {user.lastName}
              </span>{" "}
              — {user.email}
            </div>
            {user.unit ? (
              <div className="mt-1">
                {t(user.unit.building.name)} · {user.unit.label} · {t("étage")}{" "}
                {user.unit.floor}
              </div>
            ) : (
              <div className="mt-1 text-amber-700">
                {t("Votre logement n'a pas encore été rattaché par un référent.")}
              </div>
            )}
          </div>

          <Field
            label={t("Téléphone")}
            htmlFor="phone"
            hint={t("Utilisé uniquement si vous cochez « Partager mon téléphone ».")}
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={user.phone ?? ""}
            />
          </Field>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-800">
              {t("Visibilité dans l'annuaire")}
            </legend>

            <CheckboxRow
              name="shareInDirectory"
              defaultChecked={user.shareInDirectory}
              label={t("Apparaître dans l'annuaire")}
              hint={t(
                "Votre nom et votre bâtiment seront visibles par les autres locataires connectés.",
              )}
            />
            <CheckboxRow
              name="shareEmail"
              defaultChecked={user.shareEmail}
              label={t("Partager mon adresse e-mail")}
            />
            <CheckboxRow
              name="sharePhone"
              defaultChecked={user.sharePhone}
              label={t("Partager mon numéro de téléphone")}
            />
          </fieldset>

          <Button type="submit">{t("Enregistrer")}</Button>
        </form>
      </Card>
    </div>
  );
}

function CheckboxRow({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-300"
      />
      <span>
        <span className="text-sm font-medium text-gray-800">{label}</span>
        {hint ? <span className="block text-xs text-gray-500">{hint}</span> : null}
      </span>
    </label>
  );
}
