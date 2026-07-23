import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Coquille des pages publiques (accessibles sans compte) : landing générique,
 * page référent. C'est l'entrée des campagnes — aucune donnée de résidence n'y
 * est exposée.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-black tracking-tight text-rose-700">
              Voisins Unis
            </span>
            <span className="hidden text-xs font-medium text-gray-500 sm:inline">
              Collectif de locataires
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/referent"
              className="hidden rounded-lg px-3 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-100 sm:inline-block"
            >
              Devenir référent
            </Link>
            <Link
              href="/connexion"
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Se connecter
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Plateforme privée : chaque résidence a son espace cloisonné, validé
            par un référent.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/affiche" className="hover:text-gray-800 hover:underline">
              Affiche à imprimer
            </Link>
            <span aria-hidden>·</span>
            <Link
              href="/confidentialite"
              className="hover:text-gray-800 hover:underline"
            >
              Confidentialité
            </Link>
            <span aria-hidden>·</span>
            <Link
              href="/mentions-legales"
              className="hover:text-gray-800 hover:underline"
            >
              Mentions légales
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
