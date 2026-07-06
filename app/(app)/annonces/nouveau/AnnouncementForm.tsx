"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useT } from "@/components/I18nProvider";
import { createAnnouncement, type AnnouncementFormState } from "../actions";

type Building = { id: string; name: string };

export default function AnnouncementForm({
  buildings,
}: {
  buildings: Building[];
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<
    AnnouncementFormState,
    FormData
  >(createAnnouncement, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}

      <Field label={t("Titre")} htmlFor="title">
        <Input id="title" name="title" required maxLength={140} />
      </Field>

      <Field
        label={t("Destinataires")}
        htmlFor="buildingId"
        hint={t("Laissez « Toutes résidences » pour une annonce visible par tous.")}
      >
        <Select id="buildingId" name="buildingId" defaultValue="">
          <option value="">{t("Toutes résidences")}</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {t(b.name)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("Contenu")} htmlFor="body">
        <Textarea id="body" name="body" required />
      </Field>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="pinned"
          className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-300"
        />
        <span className="text-sm font-medium text-gray-800">
          {t("Épingler en haut de la liste")}
        </span>
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? t("Publication…") : t("Publier l'annonce")}
      </Button>
    </form>
  );
}
