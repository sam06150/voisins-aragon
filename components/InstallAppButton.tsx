"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useT } from "@/components/I18nProvider";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallAppButton() {
  const t = useT();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;
    if (standalone) {
      setInstalled(true);
      setReady(true);
      return;
    }
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    setReady(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  if (!ready) return null;

  if (installed) {
    return (
      <p className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
        ✓ {t("Application installée")}
      </p>
    );
  }

  if (deferred) {
    return (
      <Button type="button" onClick={install}>
        📲 {t("Installer l'application")}
      </Button>
    );
  }

  if (isIOS) {
    return (
      <p className="text-sm text-gray-600">
        {t("Sur iPhone : appuyez sur")} <strong>Partager ⬆️</strong>{" "}
        {t("puis")} <strong>« {t("Sur l'écran d'accueil")} »</strong>.
      </p>
    );
  }

  return (
    <p className="text-sm text-gray-600">
      {t(
        "Pour installer l'appli : menu du navigateur → « Installer l'application » ou « Ajouter à l'écran d'accueil ».",
      )}
    </p>
  );
}
