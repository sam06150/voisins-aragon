"use client";

import { useActionState, useState } from "react";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import { useT } from "@/components/I18nProvider";
import { createPoll, type PollFormState } from "../actions";

type Building = { id: string; name: string };

export default function PollForm({ buildings }: { buildings: Building[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<PollFormState, FormData>(
    createPoll,
    {},
  );
  const [options, setOptions] = useState<string[]>(["", ""]);

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }
  function addOption() {
    if (options.length < 10) setOptions((prev) => [...prev, ""]);
  }
  function removeOption(i: number) {
    if (options.length > 2)
      setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}

      <Field label={t("Question")} htmlFor="question">
        <Input
          id="question"
          name="question"
          required
          maxLength={200}
          placeholder={t("Ex : Êtes-vous pour une action le 15 septembre ?")}
        />
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

      <div>
        <span className="mb-1 block text-sm font-medium text-gray-700">
          {t("Options de réponse")}
        </span>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                name="options"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`${t("Option")} ${i + 1}`}
                required
              />
              {options.length > 2 ? (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                  aria-label="Retirer l'option"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {options.length < 10 ? (
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-sm font-medium text-rose-700 hover:underline"
          >
            + {t("Ajouter une option")}
          </button>
        ) : null}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? t("Création…") : t("Créer le sondage")}
      </Button>
    </form>
  );
}
