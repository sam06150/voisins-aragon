"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useT } from "@/components/I18nProvider";
import { createPetition, type PetitionFormState } from "../actions";

type Building = { id: string; name: string };

export default function PetitionForm({ buildings }: { buildings: Building[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<
    PetitionFormState,
    FormData
  >(createPetition, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}

      <Field label={t("Titre de la pétition")} htmlFor="title">
        <Input id="title" name="title" required maxLength={140} />
      </Field>

      <Field label={t("Texte de la pétition")} htmlFor="description">
        <Textarea
          id="description"
          name="description"
          required
          placeholder={t("Nous, locataires soussignés, demandons…")}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <Field
          label={t("Objectif de signatures (facultatif)")}
          htmlFor="goal"
          hint={t("Pour afficher une barre de progression.")}
        >
          <Input id="goal" name="goal" type="number" min={1} placeholder={t("Ex : 50")} />
        </Field>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? t("Publication…") : t("Lancer la pétition")}
      </Button>
    </form>
  );
}
