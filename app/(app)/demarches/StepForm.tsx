"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { landlordStepTypes } from "@/lib/validation";
import { landlordStepLabels } from "@/lib/labels";
import { useT } from "@/components/I18nProvider";
import { createStep, type StepFormState } from "./actions";

type Building = { id: string; name: string };

export default function StepForm({ buildings }: { buildings: Building[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<StepFormState, FormData>(
    createStep,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}

      <Field label={t("Intitulé de la démarche")} htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          placeholder={t("Ex : Courrier recommandé au bailleur")}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={t("Type")} htmlFor="type">
          <Select id="type" name="type" required defaultValue="">
            <option value="">{t("— Choisir —")}</option>
            {landlordStepTypes.map((type) => (
              <option key={type} value={type}>
                {t(landlordStepLabels[type])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("Date")} htmlFor="occurredAt">
          <Input id="occurredAt" name="occurredAt" type="date" required />
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
      </div>

      <Field label={t("Détail (facultatif)")} htmlFor="detail">
        <Textarea
          id="detail"
          name="detail"
          placeholder={t("Contenu du courrier, réponse obtenue, prochaines étapes…")}
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? t("Ajout…") : t("Ajouter à la frise")}
      </Button>
    </form>
  );
}
