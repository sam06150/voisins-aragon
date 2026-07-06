"use client";

import { useState } from "react";
import { useLocale } from "./I18nProvider";
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n-shared";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const [busy, setBusy] = useState(false);

  async function change(next: Locale) {
    if (next === locale || busy) return;
    setBusy(true);
    // Repli client immédiat (si la requête réseau échoue).
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    try {
      // Pose du cookie côté serveur (attributs durables et fiables).
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
    } catch {
      // On garde quand même le cookie client.
    }
    // Rechargement complet pour appliquer langue + direction (LTR/RTL).
    window.location.reload();
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Langue</span>
      <select
        value={locale}
        disabled={busy}
        onChange={(e) => change(e.target.value as Locale)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        aria-label="Langue"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
