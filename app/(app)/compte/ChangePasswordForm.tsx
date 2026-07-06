"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { useT } from "@/components/I18nProvider";
import { changePassword, type PasswordFormState } from "./actions";

export default function ChangePasswordForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState<
    PasswordFormState,
    FormData
  >(changePassword, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      {state.ok ? (
        <Alert kind="success">{t("Votre mot de passe a été mis à jour.")}</Alert>
      ) : null}

      <Field label={t("Mot de passe actuel")} htmlFor="currentPassword">
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Field
        label={t("Nouveau mot de passe")}
        htmlFor="newPassword"
        hint={t("8 caractères minimum.")}
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      <Field label={t("Confirmer le nouveau mot de passe")} htmlFor="confirmPassword">
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? t("Enregistrement…") : t("Changer mon mot de passe")}
      </Button>
    </form>
  );
}
