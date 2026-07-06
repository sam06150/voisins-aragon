"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useT } from "@/components/I18nProvider";
import { createHelpOffer, type HelpFormState } from "./actions";

type Building = { id: string; name: string };

export default function HelpForm({ buildings }: { buildings: Building[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<HelpFormState, FormData>(
    createHelpOffer,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Type")} htmlFor="type">
          <Select id="type" name="type" required defaultValue="OFFRE">
            <option value="OFFRE">{t("Je propose (prêt, service…)")}</option>
            <option value="DEMANDE">{t("Je cherche (besoin d'aide…)")}</option>
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
      </div>

      <Field label={t("Titre")} htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          placeholder={t("Ex : Prête une perceuse / Cherche covoiturage")}
        />
      </Field>

      <Field label={t("Description")} htmlFor="description">
        <Textarea id="description" name="description" required />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? t("Publication…") : t("Publier")}
      </Button>
    </form>
  );
}
