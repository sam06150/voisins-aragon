"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useT } from "./I18nProvider";

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

const PRIMARY: NavItem[] = [
  { href: "/accueil", label: "Accueil" },
  { href: "/annuaire", label: "Annuaire" },
  { href: "/incidents", label: "Signalements" },
  { href: "/forum", label: "Forum" },
];

const GROUPS: NavGroup[] = [
  {
    label: "Mobilisation",
    items: [
      { href: "/petitions", label: "Pétitions" },
      { href: "/sondages", label: "Sondages" },
      { href: "/demarches", label: "Démarches bailleur" },
      { href: "/statistiques", label: "Statistiques" },
    ],
  },
  {
    label: "Infos",
    items: [
      { href: "/annonces", label: "Annonces" },
      { href: "/reunions", label: "Réunions" },
      { href: "/documents", label: "Documents" },
    ],
  },
  {
    label: "Voisins",
    items: [
      { href: "/messages", label: "Messagerie" },
      { href: "/entraide", label: "Entraide" },
    ],
  },
];

export default function NavBar({
  firstName,
  isAdmin,
  unreadNotifications = 0,
  unreadMessages = 0,
}: {
  firstName: string;
  isAdmin: boolean;
  unreadNotifications?: number;
  unreadMessages?: number;
}) {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/accueil" className="flex flex-col leading-tight">
          <span className="text-base font-black tracking-tight text-rose-700">
            {t("Voisins")}{" "}
            <span className="text-gray-800">{t("& en Colère")}</span>
          </span>
          <span className="text-[11px] font-medium text-gray-400">
            {t("Résidence Aragon")}
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {PRIMARY.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-2.5 py-2 text-sm font-medium transition ${
                isActive(l.href)
                  ? "bg-rose-50 text-rose-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {t(l.label)}
            </Link>
          ))}

          {GROUPS.map((g) => {
            const groupActive = g.items.some((i) => isActive(i.href));
            return (
              <div
                key={g.label}
                className="relative"
                onMouseEnter={() => setDropdown(g.label)}
                onMouseLeave={() => setDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() =>
                    setDropdown((d) => (d === g.label ? null : g.label))
                  }
                  className={`flex items-center gap-1 rounded-md px-2.5 py-2 text-sm font-medium transition ${
                    groupActive
                      ? "bg-rose-50 text-rose-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {t(g.label)}
                  <span className="text-[10px]">▾</span>
                </button>
                {dropdown === g.label ? (
                  <div className="absolute left-0 top-full z-40 min-w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {g.items.map((i) => (
                      <Link
                        key={i.href}
                        href={i.href}
                        onClick={() => setDropdown(null)}
                        className={`block px-3 py-2 text-sm ${
                          isActive(i.href)
                            ? "bg-rose-50 text-rose-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {t(i.label)}
                        {i.href === "/messages" && unreadMessages > 0 ? (
                          <span className="ml-2 rounded-full bg-rose-600 px-1.5 text-xs text-white">
                            {unreadMessages}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          {isAdmin ? (
            <Link
              href="/admin/comptes"
              className={`rounded-md px-2.5 py-2 text-sm font-medium transition ${
                isActive("/admin")
                  ? "bg-rose-50 text-rose-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {t("Admin")}
            </Link>
          ) : null}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <SearchIcon />
          <ThemeToggle />
          <NotifBell count={unreadNotifications} />
          <Link
            href="/compte"
            className="text-sm text-gray-500 hover:text-rose-700"
          >
            <span className="font-semibold text-gray-800">{firstName}</span>
          </Link>
          <LogoutButton className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50" />
        </div>

        {/* Actions mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <SearchIcon />
          <ThemeToggle />
          <NotifBell count={unreadNotifications} />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Menu"
            aria-expanded={open}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {open ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {open ? (
        <nav className="max-h-[80vh] overflow-y-auto border-t border-gray-100 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {PRIMARY.map((l) => (
              <MobileLink
                key={l.href}
                item={l}
                active={isActive(l.href)}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>

          {GROUPS.map((g) => (
            <div key={g.label} className="mt-3">
              <div className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t(g.label)}
              </div>
              <div className="mt-1 flex flex-col gap-1">
                {g.items.map((i) => (
                  <MobileLink
                    key={i.href}
                    item={i}
                    active={isActive(i.href)}
                    badge={
                      i.href === "/messages" ? unreadMessages : undefined
                    }
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}

          {isAdmin ? (
            <div className="mt-3">
              <MobileLink
                item={{ href: "/admin/comptes", label: "Administration" }}
                active={isActive("/admin")}
                onNavigate={() => setOpen(false)}
              />
            </div>
          ) : null}

          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="mb-3">
              <LanguageSwitcher />
            </div>
            <div className="flex items-center justify-between">
              <Link
                href="/compte"
                onClick={() => setOpen(false)}
                className="text-sm text-gray-500 hover:text-rose-700"
              >
                {t("Mon compte")} (
                <span className="font-semibold">{firstName}</span>)
              </Link>
              <LogoutButton className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50" />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function MobileLink({
  item,
  active,
  badge,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  onNavigate: () => void;
}) {
  const t = useT();
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
        active ? "bg-rose-50 text-rose-700" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {t(item.label)}
      {badge && badge > 0 ? (
        <span className="rounded-full bg-rose-600 px-1.5 text-xs text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function SearchIcon() {
  return (
    <Link
      href="/recherche"
      className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
      aria-label="Recherche"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    </Link>
  );
}

function NotifBell({ count }: { count: number }) {
  return (
    <Link
      href="/notifications"
      className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100"
      aria-label="Notifications"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
