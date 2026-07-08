"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "@/components/ui";
import PrintButton from "@/components/PrintButton";
import { useT } from "@/components/I18nProvider";

export default function LetterEditor({
  senderName,
  senderMeta,
  destDefault,
  objetDefault,
  corpsDefault,
}: {
  senderName: string;
  senderMeta: string;
  destDefault: string;
  objetDefault: string;
  corpsDefault: string;
}) {
  const t = useT();
  const [ville, setVille] = useState("");
  const [dest, setDest] = useState(destDefault);
  const [objet, setObjet] = useState(objetDefault);
  const [corps, setCorps] = useState(corpsDefault);

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Formulaire (non imprimé) */}
      <div className="space-y-4 print:hidden">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("Votre ville")} htmlFor="ville">
            <Input
              id="ville"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder={t("Ex : Paris")}
            />
          </Field>
          <Field label={t("Objet")} htmlFor="objet">
            <Input
              id="objet"
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
            />
          </Field>
        </div>
        <Field
          label={t("Destinataire (bailleur / gestionnaire)")}
          htmlFor="dest"
          hint={t("Renseignez le nom et l'adresse de votre bailleur.")}
        >
          <Textarea
            id="dest"
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            className="min-h-20"
          />
        </Field>
        <Field label={t("Corps de la lettre")} htmlFor="corps">
          <Textarea
            id="corps"
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            className="min-h-64"
          />
        </Field>
        <div className="flex items-center gap-3">
          <PrintButton />
          <p className="text-xs text-gray-500">
            {t("Relisez et complétez, puis imprimez ou enregistrez en PDF pour l'envoyer (idéalement en recommandé).")}
          </p>
        </div>
      </div>

      {/* Aperçu imprimable */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-[15px] leading-relaxed text-gray-900 shadow-sm print:mt-0 print:border-0 print:p-0 print:shadow-none">
        <div className="text-sm">
          <div className="font-semibold">{senderName}</div>
          <div className="whitespace-pre-wrap text-gray-700">{senderMeta}</div>
        </div>

        <div className="mt-8 whitespace-pre-wrap text-sm">{dest}</div>

        <div className="mt-6 text-right text-sm text-gray-700">
          {ville ? `${ville}, ` : ""}
          {t("le")} {dateStr}
        </div>

        <div className="mt-8 font-semibold">
          {t("Objet")} : {objet}
        </div>

        <div className="mt-4 whitespace-pre-wrap">{corps}</div>

        <div className="mt-10">
          <div className="text-sm text-gray-500">{t("Signature :")}</div>
          <div className="mt-1 font-semibold">{senderName}</div>
        </div>
      </div>
    </div>
  );
}
