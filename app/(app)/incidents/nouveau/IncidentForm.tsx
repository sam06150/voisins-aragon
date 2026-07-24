"use client";

import { useActionState, useMemo, useState } from "react";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { incidentCategories } from "@/lib/validation";
import { incidentCategoryLabels } from "@/lib/labels";
import { useT } from "@/components/I18nProvider";
import { createIncident, type IncidentFormState } from "../actions";

type Building = { id: string; name: string };
type Unit = { id: string; label: string; floor: number; buildingId: string };

export default function IncidentForm({
  buildings,
  units,
  defaultBuildingId,
}: {
  buildings: Building[];
  units: Unit[];
  defaultBuildingId?: string;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<
    IncidentFormState,
    FormData
  >(createIncident, {});
  const [buildingId, setBuildingId] = useState(defaultBuildingId ?? "");

  const buildingUnits = useMemo(
    () => units.filter((u) => u.buildingId === buildingId),
    [units, buildingId],
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}

      <Field label={t("Titre")} htmlFor="title">
        <Input id="title" name="title" required maxLength={140} />
      </Field>

      <Field label={t("Catégorie")} htmlFor="category">
        <Select id="category" name="category" required defaultValue="">
          <option value="">{t("— Choisir —")}</option>
          {incidentCategories.map((c) => (
            <option key={c} value={c}>
              {t(incidentCategoryLabels[c])}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Bâtiment concerné")} htmlFor="buildingId">
          <Select
            id="buildingId"
            name="buildingId"
            required
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
          >
            <option value="">{t("— Choisir —")}</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {t(b.name)}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={t("Appartement / lieu (facultatif)")}
          htmlFor="unitId"
          hint={buildingId ? undefined : t("Choisissez d'abord un bâtiment.")}
        >
          <Select id="unitId" name="unitId" disabled={!buildingId}>
            <option value="">{t("— Non précisé —")}</option>
            {buildingUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label} ({t("étage")} {u.floor})
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={t("Description")} htmlFor="description">
        <Textarea
          id="description"
          name="description"
          required
          placeholder={t("Décrivez le problème, depuis quand, où exactement…")}
        />
      </Field>

      <Alert kind="warning">
        {t(
          "⚠️ Avant d'envoyer une pièce jointe, pensez à retirer vos informations personnelles (nom, adresse, numéro de dossier, données visibles sur une photo…) que vous ne souhaitez pas rendre publiques.",
        )}
      </Alert>

      <Field
        label={t("Photos (facultatif)")}
        htmlFor="photos"
        hint={t(
          "JPEG, PNG, WEBP ou PDF · 10 Mo max par fichier. Plusieurs fichiers possibles.",
        )}
      >
        <input
          id="photos"
          name="photos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-rose-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-rose-700 hover:file:bg-rose-100"
        />
      </Field>

      <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <input
          type="checkbox"
          name="anonymous"
          value="on"
          className="mt-0.5 h-5 w-5 rounded border-gray-300 text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500"
        />
        <span className="text-sm">
          <span className="font-semibold text-gray-900">
            {t("Signaler anonymement")}
          </span>
          <span className="mt-0.5 block text-gray-600">
            {t(
              "Votre nom ne sera affiché à personne (protection contre d'éventuelles représailles du bailleur). Les référents ne verront pas non plus votre nom sur ce signalement.",
            )}
          </span>
        </span>
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? t("Envoi…") : t("Publier le signalement")}
      </Button>
    </form>
  );
}
