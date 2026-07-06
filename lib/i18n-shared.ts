import { translations } from "./translations";

export const LOCALES = ["fr", "en", "ar", "pt", "tr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";
export const RTL_LOCALES: Locale[] = ["ar"];

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
  pt: "Português",
  tr: "Türkçe",
};

export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

/**
 * Fabrique une fonction de traduction. La CLÉ est le texte français ;
 * si aucune traduction n'existe pour la locale, on renvoie le français.
 */
export function makeT(locale: Locale) {
  return function t(fr: string): string {
    if (locale === DEFAULT_LOCALE) return fr;
    const entry = translations[fr];
    return (entry && entry[locale as Exclude<Locale, "fr">]) ?? fr;
  };
}

export type TFunction = ReturnType<typeof makeT>;
