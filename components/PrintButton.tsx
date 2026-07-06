"use client";

import { useT } from "./I18nProvider";

export default function PrintButton({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 ${className}`}
    >
      {children ?? `🖨️ ${t("Imprimer / Enregistrer en PDF")}`}
    </button>
  );
}
