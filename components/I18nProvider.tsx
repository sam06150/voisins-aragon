"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeT, DEFAULT_LOCALE, type Locale } from "@/lib/i18n-shared";

const I18nContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <I18nContext.Provider value={locale}>{children}</I18nContext.Provider>;
}

/** Hook de traduction pour les composants client. */
export function useT() {
  const locale = useContext(I18nContext);
  return useMemo(() => makeT(locale), [locale]);
}

export function useLocale() {
  return useContext(I18nContext);
}
