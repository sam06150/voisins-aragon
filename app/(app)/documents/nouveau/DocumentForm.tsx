"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import { documentCategories } from "@/lib/validation";
import { documentCategoryLabels } from "@/lib/labels";
import { useT } from "@/components/I18nProvider";
import { createDocument, type DocumentFormState } from "../actions";

type Building = { id: string; name: string };

export default function DocumentForm({
  buildings,
  meetingId,
}: {
  buildings: Building[];
  meetingId?: string;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<
    DocumentFormState,
    FormData
  >(createDocument, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      {meetingId ? <input type="hidden" name="meetingId" value={meetingId} /> : null}

      <Field label={t("Titre du document")} htmlFor="title">
        <Input id="title" name="title" required maxLength={140} />
      </Field>

      <Field label={t("Catégorie")} htmlFor="category">
        <Select id="category" name="category" required defaultValue="">
          <option value="">{t("— Choisir —")}</option>
          {documentCategories.map((c) => (
            <option key={c} value={c}>
              {t(documentCategoryLabels[c])}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("Concerné")} htmlFor="buildingId">
        <Select id="buildingId" name="buildingId" defaultValue="">
          <option value="">{t("Toutes résidences")}</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {t(b.name)}
            </option>
          ))}
        </Select>
      </Field>

      <Alert kind="warning">
        {t(
          "⚠️ Avant d'envoyer une pièce jointe, pensez à retirer vos informations personnelles (nom, adresse, numéro de dossier, données visibles sur une photo…) que vous ne souhaitez pas rendre publiques.",
        )}
      </Alert>

      <Field
        label={t("Fichier")}
        htmlFor="file"
        hint={t("JPEG, PNG, WEBP ou PDF · 10 Mo maximum.")}
      >
        <input
          id="file"
          name="file"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-rose-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-rose-700 hover:file:bg-rose-100"
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? t("Envoi…") : t("Ajouter le document")}
      </Button>
    </form>
  );
}
