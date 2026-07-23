import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireStaff } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isManager, isAdmin } from "@/lib/roles";

const ADMIN_LINKS = [
  { href: "/admin", label: "Tableau de bord", min: "staff" as const },
  { href: "/admin/comptes", label: "Comptes", min: "staff" as const },
  { href: "/admin/candidatures", label: "Candidatures", min: "staff" as const },
  { href: "/admin/moderation", label: "Modération forum", min: "staff" as const },
  { href: "/admin/immeubles", label: "Bâtiments & logements", min: "manager" as const },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireStaff();

  // Porte : tout membre du staff doit avoir accepté la charte du référent avant
  // d'accéder à l'espace d'administration (consentement horodaté, RGPD).
  if (!user.moderatorCharterAt) {
    redirect("/charte-referent");
  }

  const { t } = await getI18n();
  const manager = isManager(user.role);
  const admin = isAdmin(user.role);

  const links = ADMIN_LINKS.filter((l) =>
    l.min === "manager" ? manager : true,
  );

  return (
    <div>
      <div className="mb-6 rounded-xl border border-rose-100 bg-rose-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-sm font-bold uppercase tracking-wide text-rose-700">
            {t("Espace administration")}
          </h1>
          {admin ? (
            <a
              href="/api/admin/backup"
              className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
            >
              ⬇️ {t("Télécharger une sauvegarde")}
            </a>
          ) : null}
        </div>
        <nav className="mt-3 flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
            >
              {t(l.label)}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
