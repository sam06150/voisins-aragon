"use client";

import { useActionState } from "react";
import { Alert, Button, Field } from "@/components/ui";
import PasswordInput from "@/components/PasswordInput";
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
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          required
        />
      </Field>
      <Field
        label={t("Nouveau mot de passe")}
        htmlFor="newPassword"
        hint={t("8 caractères minimum.")}
      >
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          required
        />
      </Field>
      <Field label={t("Confirmer le nouveau mot de passe")} htmlFor="confirmPassword">
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
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
