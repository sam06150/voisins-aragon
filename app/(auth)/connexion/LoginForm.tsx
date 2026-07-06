"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Field, Input } from "@/components/ui";
import { useT } from "@/components/I18nProvider";

// Identifiant du compte administrateur principal (pré-rempli via l'accès admin).
const ADMIN_IDENTIFIER = "mrsds";

export default function LoginForm() {
  const router = useRouter();
  const t = useT();
  const searchParams = useSearchParams();
  const adminMode = searchParams.get("admin") === "1";

  const [email, setEmail] = useState(adminMode ? ADMIN_IDENTIFIER : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // En mode admin : identifiant pré-rempli, curseur directement sur le mot de passe.
  useEffect(() => {
    if (adminMode) {
      setEmail(ADMIN_IDENTIFIER);
      const el = document.getElementById("password") as HTMLInputElement | null;
      el?.focus();
    }
  }, [adminMode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Connexion impossible.");
        return;
      }
      if (data.status !== "APPROVED") {
        router.push("/en-attente");
      } else {
        router.push("/accueil");
      }
      router.refresh();
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {adminMode ? (
        <Alert kind="info">{t("Connexion administrateur")}</Alert>
      ) : null}
      {error ? <Alert kind="error">{error}</Alert> : null}
      <Field label={t("Identifiant ou adresse e-mail")} htmlFor="email">
        <Input
          id="email"
          type="text"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label={t("Mot de passe")} htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("Connexion…") : t("Se connecter")}
      </Button>
    </form>
  );
}
