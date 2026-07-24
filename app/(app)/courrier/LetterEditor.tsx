"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "@/components/ui";
import PrintButton from "@/components/PrintButton";
import { useT } from "@/components/I18nProvider";
import {
  LETTER_TEMPLATES,
  getTemplate,
  type LetterContext,
} from "@/lib/letterTemplates";

export default function LetterEditor({
  senderName,
  senderMeta,
  destDefault,
  ctx,
}: {
  senderName: string;
  senderMeta: string;
  destDefault: string;
  ctx: LetterContext;
}) {
  const t = useT();

  const [templateId, setTemplateId] = useState(LETTER_TEMPLATES[0].id);
  const template = getTemplate(templateId);
  const initial = template.build(ctx);

  const [ville, setVille] = useState("");
  const [dest, setDest] = useState(destDefault);
  const [objet, setObjet] = useState(initial.objet);
  const [corps, setCorps] = useState(initial.corps);
  // Permet de régénérer le texte quand on change de modèle sans écraser
  // silencieusement des retouches : on demande confirmation si l'utilisateur
  // a déjà modifié le corps.
  const [touched, setTouched] = useState(false);

  function applyTemplate(id: string) {
    if (
      touched &&
      !window.confirm(
        t(
          "Changer de modèle remplacera le texte que vous avez déjà écrit. Continuer ?",
        ),
      )
    ) {
      return;
    }
    const next = getTemplate(id).build(ctx);
    setTemplateId(id);
    setObjet(next.objet);
    setCorps(next.corps);
    setTouched(false);
  }

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Formulaire (non imprimé) */}
      <div className="space-y-4 print:hidden">
        <div>
          <span className="mb-2 block text-sm font-medium text-gray-700">
            {t("Type de courrier")}
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LETTER_TEMPLATES.map((m) => {
              const selected = m.id === templateId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => applyTemplate(m.id)}
                  aria-pressed={selected}
                  className={`rounded-lg border p-3 text-left transition ${
                    selected
                      ? "border-rose-500 bg-rose-50 ring-1 ring-rose-500"
                      : "border-gray-200 bg-white hover:border-rose-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`block text-sm font-semibold ${
                      selected ? "text-rose-700" : "text-gray-900"
                    }`}
                  >
                    {t(m.label)}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {t(m.hint)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span className="font-semibold">{t("Base légale")} :</span>{" "}
          {t(template.legal)}
          <br />
          {t(
            "Modèle indicatif — il ne remplace pas l'avis d'un juriste (ADIL, association de locataires).",
          )}
        </p>

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
              onChange={(e) => {
                setObjet(e.target.value);
                setTouched(true);
              }}
            />
          </Field>
        </div>
        <Field
          label={t("Destinataire")}
          htmlFor="dest"
          hint={t("Renseignez le nom et l'adresse du destinataire.")}
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
            onChange={(e) => {
              setCorps(e.target.value);
              setTouched(true);
            }}
            className="min-h-64"
          />
        </Field>
        <div className="flex items-center gap-3">
          <PrintButton />
          <p className="text-xs text-gray-500">
            {t(
              "Relisez et complétez, puis imprimez ou enregistrez en PDF pour l'envoyer (idéalement en recommandé avec accusé de réception).",
            )}
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
