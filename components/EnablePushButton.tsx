"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useT } from "@/components/I18nProvider";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

type State = "loading" | "unsupported" | "off" | "on" | "denied" | "busy";

export default function EnablePushButton() {
  const t = useT();
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function enable() {
    setError(null);
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const res = await fetch("/api/push/public-key");
      if (!res.ok) throw new Error("clé indisponible");
      const { key } = await res.json();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const save = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!save.ok) throw new Error("enregistrement échoué");
      setState("on");
    } catch {
      setError(t("Impossible d'activer les notifications sur cet appareil."));
      setState("off");
    }
  }

  if (state === "loading") return null;
  if (state === "unsupported") {
    return (
      <p className="text-xs text-gray-500">
        {t("Les notifications push ne sont pas disponibles sur ce navigateur. Sur iPhone, ajoutez d'abord l'appli à l'écran d'accueil.")}
      </p>
    );
  }
  if (state === "on") {
    return (
      <p className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
        🔔 {t("Notifications activées sur cet appareil")}
      </p>
    );
  }
  if (state === "denied") {
    return (
      <p className="text-xs text-amber-700">
        {t("Notifications bloquées. Autorisez-les dans les réglages du navigateur pour cette page.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" onClick={enable} disabled={state === "busy"}>
        🔔 {state === "busy" ? t("Activation…") : t("Activer les notifications")}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
