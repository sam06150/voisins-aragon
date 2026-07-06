"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Select, Textarea } from "@/components/ui";
import { useT } from "@/components/I18nProvider";
import { sendMessage, type MessageFormState } from "../actions";

type Recipient = { id: string; name: string };

export default function NewMessageForm({
  recipients,
  defaultRecipientId,
}: {
  recipients: Recipient[];
  defaultRecipientId?: string;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<
    MessageFormState,
    FormData
  >(sendMessage, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}

      <Field label={t("Destinataire")} htmlFor="recipientId">
        <Select
          id="recipientId"
          name="recipientId"
          required
          defaultValue={defaultRecipientId ?? ""}
        >
          <option value="">{t("— Choisir un voisin —")}</option>
          {recipients.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("Message")} htmlFor="body">
        <Textarea id="body" name="body" required />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? t("Envoi…") : t("Envoyer")}
      </Button>
    </form>
  );
}
