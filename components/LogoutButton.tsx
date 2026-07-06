"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "./I18nProvider";

export default function LogoutButton({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const t = useT();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/connexion");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={className}
    >
      {loading ? "…" : (children ?? t("Se déconnecter"))}
    </button>
  );
}
