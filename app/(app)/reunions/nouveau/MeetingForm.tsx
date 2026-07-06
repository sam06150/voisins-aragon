"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useT } from "@/components/I18nProvider";
import { createMeeting, type MeetingFormState } from "../actions";

type Building = { id: string; name: string };

export default function MeetingForm({ buildings }: { buildings: Building[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<
    MeetingFormState,
    FormData
  >(createMeeting, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}

      <Field label={t("Titre")} htmlFor="title">
        <Input id="title" name="title" required maxLength={140} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Date et heure")} htmlFor="scheduledAt">
          <Input
            id="scheduledAt"
            name="scheduledAt"
            type="datetime-local"
            required
          />
        </Field>
        <Field label={t("Lieu (facultatif)")} htmlFor="location">
          <Input id="location" name="location" placeholder={t("Hall du bât. A…")} />
        </Field>
      </div>

      <Field label={t("Concernée")} htmlFor="buildingId">
        <Select id="buildingId" name="buildingId" defaultValue="">
          <option value="">{t("Toutes résidences")}</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {t(b.name)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("Ordre du jour (facultatif)")} htmlFor="agenda">
        <Textarea id="agenda" name="agenda" placeholder={t("Points à aborder…")} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? t("Création…") : t("Créer la réunion")}
      </Button>
    </form>
  );
}
