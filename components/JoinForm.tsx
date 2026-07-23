"use client";

import { useState } from "react";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";

type Kind = "REFERENT" | "LOCATAIRE";

const COUNTRIES = [
  ["FR", "France"],
  ["BE", "Belgique"],
  ["CH", "Suisse"],
  ["LU", "Luxembourg"],
  ["CA", "Canada / Québec"],
  ["MA", "Maroc"],
  ["DZ", "Algérie"],
  ["TN", "Tunisie"],
  ["PT", "Portugal"],
  ["ES", "Espagne"],
  ["IT", "Italie"],
  ["DE", "Allemagne"],
  ["GB", "Royaume-Uni"],
] as const;

export default function JoinForm({
  defaultKind = "LOCATAIRE",
  lockKind = false,
}: {
  defaultKind?: Kind;
  lockKind?: boolean;
}) {
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    postalCode: "",
    country: "FR",
    landlord: "",
    residenceName: "",
    buildingName: "",
    message: "",
  });
  const [consent, setConsent] = useState(false);
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
      const res = await fetch("/api/rejoindre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, kind, consent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Envoi impossible.");
        return;
      }
      setDone(true);
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Alert kind="success">
        <p className="font-semibold">Demande envoyée.</p>
        <p className="mt-1">
          {kind === "REFERENT"
            ? "On revient vers vous par e-mail pour ouvrir l'espace de votre résidence. En attendant : parlez-en à vos voisins, plus vous serez nombreux, plus vite ça avancera."
            : "On vous prévient dès que l'espace de votre résidence est ouvert. Si vous connaissez quelqu'un de motivé dans votre bâtiment, dites-lui de se proposer comme référent : c'est ce qui débloque tout."}
        </p>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <Alert kind="error">{error}</Alert> : null}

      {!lockKind ? (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Vous vous inscrivez comme :
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <KindCard
              active={kind === "LOCATAIRE"}
              onClick={() => setKind("LOCATAIRE")}
              title="Locataire"
              desc="Je veux rejoindre l'espace de ma résidence et peser dans le nombre."
            />
            <KindCard
              active={kind === "REFERENT"}
              onClick={() => setKind("REFERENT")}
              title="Référent / modérateur"
              desc="Je veux ouvrir et animer l'espace de mon bâtiment (~10 min/semaine)."
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prénom" htmlFor="jf-firstName">
          <Input
            id="jf-firstName"
            required
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
          />
        </Field>
        <Field label="Nom" htmlFor="jf-lastName">
          <Input
            id="jf-lastName"
            required
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Adresse e-mail" htmlFor="jf-email">
        <Input
          id="jf-email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Pays" htmlFor="jf-country">
          <Select
            id="jf-country"
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
          >
            {COUNTRIES.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ville" htmlFor="jf-city">
          <Input
            id="jf-city"
            required
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </Field>
        <Field label="Code postal" htmlFor="jf-postalCode">
          <Input
            id="jf-postalCode"
            value={form.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
          />
        </Field>
      </div>

      <Field
        label="Nom de la résidence"
        htmlFor="jf-residenceName"
        hint="Ex : Résidence Aragon, Cité des Peupliers, 12 rue Victor-Hugo…"
      >
        <Input
          id="jf-residenceName"
          required
          value={form.residenceName}
          onChange={(e) => update("residenceName", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Bâtiment (facultatif)"
          htmlFor="jf-buildingName"
          hint="Ex : Bâtiment A, Tour 3, Escalier B"
        >
          <Input
            id="jf-buildingName"
            value={form.buildingName}
            onChange={(e) => update("buildingName", e.target.value)}
          />
        </Field>
        <Field
          label="Bailleur (facultatif)"
          htmlFor="jf-landlord"
          hint="Ex : CDC Habitat, 3F, Vilogia, ICF, propriétaire privé…"
        >
          <Input
            id="jf-landlord"
            value={form.landlord}
            onChange={(e) => update("landlord", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Téléphone (facultatif)" htmlFor="jf-phone">
        <Input
          id="jf-phone"
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </Field>

      <Field
        label={
          kind === "REFERENT"
            ? "Votre situation en deux lignes (facultatif)"
            : "Le problème dans votre résidence (facultatif)"
        }
        htmlFor="jf-message"
        hint={
          kind === "REFERENT"
            ? "Combien de logements ? Y a-t-il déjà un groupe de voisins ?"
            : "Chauffage, ascenseur, charges, insalubrité, absence de réponse du bailleur…"
        }
      >
        <Textarea
          id="jf-message"
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
        />
      </Field>

      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
        />
        <span>
          J&apos;ai lu et j&apos;accepte la{" "}
          <a
            href="/confidentialite"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-rose-700 hover:underline"
          >
            politique de confidentialité
          </a>
          . Mes informations servent uniquement à ouvrir l&apos;espace de ma
          résidence et ne sont jamais transmises au bailleur.
        </span>
      </label>

      <Button type="submit" disabled={loading || !consent} className="w-full">
        {loading
          ? "Envoi…"
          : kind === "REFERENT"
            ? "Je me propose comme référent"
            : "Je veux rejoindre ma résidence"}
      </Button>
    </form>
  );
}

function KindCard({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border p-3 text-left transition ${
        active
          ? "border-rose-500 bg-rose-50 ring-2 ring-rose-200"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <span className="block text-sm font-bold text-gray-900">{title}</span>
      <span className="mt-1 block text-xs leading-snug text-gray-600">
        {desc}
      </span>
    </button>
  );
}
