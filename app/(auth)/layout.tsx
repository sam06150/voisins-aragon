import Link from "next/link";
import type { ReactNode } from "react";
import { getI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = await getI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-gray-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-center">
          <LanguageSwitcher />
        </div>
        <Link href="/" className="mb-6 block text-center">
          <div className="text-2xl font-black tracking-tight text-rose-700">
            {t("Voisins")} {t("Collectif")}{" "}
            <span className="text-gray-800">{t("& en Colère")}</span>
          </div>
          <div className="mt-1 text-sm font-medium text-gray-500">
            {t("Résidence Aragon")}
          </div>
        </Link>
        {children}

        {/* Accès discret : administration + contact */}
        <footer className="mt-8 flex items-center justify-center gap-3 text-xs text-gray-400">
          <Link
            href="/connexion?admin=1"
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white/60 px-2.5 py-1 font-medium text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
          >
            🔒 {t("Accès administrateur")}
          </Link>
          <span aria-hidden>·</span>
          <a
            href="mailto:sdsb.2023@gmail.com"
            className="transition hover:text-gray-600 hover:underline"
          >
            {t("Me contacter")}
          </a>
        </footer>
      </div>
    </div>
  );
}
