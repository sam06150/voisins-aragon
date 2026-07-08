"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { useT } from "@/components/I18nProvider";

export default function CopyLinkButton({ url }: { url: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papier indisponible : on ignore silencieusement.
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Voisins Collectif et en Colère",
          text: "Rejoins la plateforme des voisins :",
          url,
        });
      } catch {
        // partage annulé : on ignore
      }
    } else {
      copy();
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button type="button" variant="secondary" onClick={copy}>
        {copied ? `✓ ${t("Lien copié")}` : `🔗 ${t("Copier le lien")}`}
      </Button>
      <Button type="button" onClick={share}>
        📤 {t("Partager")}
      </Button>
    </div>
  );
}
