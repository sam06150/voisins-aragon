"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import PasswordInput from "@/components/PasswordInput";
import { useT } from "@/components/I18nProvider";

type Building = { id: string; name: string };

export default function SignupForm({ buildings }: { buildings: Building[] }) {
  const router = useRouter();
  const t = useT();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    residenceName: "",
    buildingId: "",
    unitLabel: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Inscription impossible.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/connexion"), 2500);
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Alert kind="success">
        {t(
          "Votre demande a bien été envoyée ! Un référent du collectif doit valider votre compte avant que vous puissiez vous connecter. Redirection vers la page de connexion…",
        )}
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <Alert kind="error">{error}</Alert> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Prénom")} htmlFor="firstName">
          <Input
            id="firstName"
            required
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
          />
        </Field>
        <Field label={t("Nom")} htmlFor="lastName">
          <Input
            id="lastName"
            required
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
          />
        </Field>
      </div>
      <Field label={t("Adresse e-mail")} htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </Field>
      <Field
        label={t("Mot de passe")}
        htmlFor="password"
        hint={t("8 caractères minimum.")}
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
        />
      </Field>
      <Field
        label={t("Nom de la résidence (facultatif)")}
        htmlFor="residenceName"
        hint={t(
          "Si votre résidence n'est pas encore dans la liste, indiquez son nom : un référent la créera à la validation.",
        )}
      >
        <Input
          id="residenceName"
          value={form.residenceName}
          onChange={(e) => update("residenceName", e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Bâtiment")} htmlFor="buildingId">
          <Select
            id="buildingId"
            required
            value={form.buildingId}
            onChange={(e) => update("buildingId", e.target.value)}
          >
            <option value="">{t("— Choisir —")}</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {t(b.name)}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t("Étage / appartement")}
          htmlFor="unitLabel"
          hint={t("Ex : 3e étage, porte gauche")}
        >
          <Input
            id="unitLabel"
            required
            value={form.unitLabel}
            onChange={(e) => update("unitLabel", e.target.value)}
          />
        </Field>
      </div>
      <Field label={t("Téléphone (facultatif)")} htmlFor="phone">
        <Input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </Field>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("Envoi…") : t("Créer mon compte")}
      </Button>
    </form>
  );
}
