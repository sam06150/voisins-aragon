import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dirFor,
  isLocale,
  makeT,
  type Locale,
} from "./i18n-shared";

/** Locale courante (depuis le cookie), côté serveur. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Helpers de traduction côté serveur. */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: makeT(locale), dir: dirFor(locale) };
}
