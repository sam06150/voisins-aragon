"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useT } from "@/components/I18nProvider";
import { createThread, type ThreadFormState } from "../actions";

type Category = { id: string; name: string; isGeneral: boolean };

export default function ThreadForm({
  categories,
  defaultCategoryId,
}: {
  categories: Category[];
  defaultCategoryId?: string;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<
    ThreadFormState,
    FormData
  >(createThread, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}

      <Field label={t("Catégorie")} htmlFor="categoryId">
        <Select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={defaultCategoryId ?? ""}
        >
          <option value="">{t("— Choisir —")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.isGeneral ? "🌍 " : "🏢 "}
              {t(c.name)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("Titre de la discussion")} htmlFor="title">
        <Input id="title" name="title" required maxLength={140} />
      </Field>

      <Field label={t("Votre message")} htmlFor="body">
        <Textarea id="body" name="body" required />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? t("Publication…") : t("Publier la discussion")}
      </Button>
    </form>
  );
}
