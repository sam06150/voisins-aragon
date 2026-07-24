import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import {
  scopeFor,
  buildingScopeWhere,
  optionalBuildingScopeWhere,
  buildingsFor,
} from "@/lib/tenancy";
import { publicFileUrl } from "@/lib/storage";
import { Select } from "@/components/ui";
import PrintButton from "@/components/PrintButton";
import {
  formatDate,
  formatDateTime,
  incidentCategoryLabels,
  incidentStatusLabels,
  landlordStepLabels,
} from "@/lib/labels";

export default async function DossierPage({
  searchParams,
}: {
  searchParams: Promise<{ batiment?: string }>;
}) {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();
  const { batiment } = await searchParams;

  const buildings = await buildingsFor(scope);
  const selected = batiment && batiment !== "tous" ? batiment : null;
  const building = selected
    ? buildings.find((b) => b.id === selected)
    : null;

  const [incidents, steps] = await Promise.all([
    prisma.incidentReport.findMany({
      where: {
        AND: [
          buildingScopeWhere(scope), // cloisonnement par résidence
          selected ? { buildingId: selected } : {},
        ],
      },
      include: {
        building: true,
        unit: true,
        author: { select: { id: true, firstName: true, lastName: true } },
        photos: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    // Chronologie des démarches vis-à-vis du bailleur (buildingId nullable).
    prisma.landlordStep.findMany({
      where: {
        AND: [
          optionalBuildingScopeWhere(scope),
          selected ? { OR: [{ buildingId: null }, { buildingId: selected }] } : {},
        ],
      },
      orderBy: { occurredAt: "asc" },
    }),
  ]);

  // --- Synthèse chiffrée pour l'en-tête du dossier ---
  const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const closed = incidents.filter(
    (i) => i.status === "RESOLU" || i.status === "CLOS",
  );
  const openOld = incidents.filter(
    (i) =>
      (i.status === "OUVERT" || i.status === "EN_COURS") &&
      i.createdAt < THIRTY_DAYS_AGO,
  );
  const resolutionRate =
    incidents.length > 0
      ? Math.round((closed.length / incidents.length) * 100)
      : 0;
  const photoCount = incidents.reduce(
    (n, i) => n + i.photos.filter((p) => !p.filePath.endsWith(".pdf")).length,
    0,
  );

  return (
    <div>
      {/* Barre d'outils — masquée à l'impression */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/incidents"
          className="text-sm text-gray-500 hover:underline"
        >
          ← {t("Retour aux signalements")}
        </Link>
        <div className="flex items-center gap-3">
          <form method="get" className="flex items-center gap-2">
            <Select
              name="batiment"
              defaultValue={selected ?? "tous"}
              className="w-auto"
            >
              <option value="tous">{t("Tous les bâtiments")}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {t(b.name)}
                </option>
              ))}
            </Select>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t("Filtrer")}
            </button>
          </form>
          <PrintButton />
        </div>
      </div>

      {/* Contenu imprimable */}
      <article className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <header className="mb-6 border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("Dossier de signalements")}
          </h1>
          <p className="mt-1 text-gray-600">
            {t("Voisins Collectif et en Colère")}
            {building ? ` — ${t(building.name)}` : ` — ${t("Tous les bâtiments")}`}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {t("Document généré le")} {formatDate(new Date())} ·{" "}
            {incidents.length} {t("signalement(s)")} · {photoCount}{" "}
            {t("preuve(s) photo")}
          </p>
        </header>

        {/* Synthèse chiffrée — argumentaire opposable */}
        {incidents.length > 0 ? (
          <section className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-4 print:bg-white">
            <SynthItem label={t("Signalements")} value={incidents.length} />
            <SynthItem
              label={t("Résolus")}
              value={`${closed.length} (${resolutionRate}%)`}
            />
            <SynthItem
              label={t("Ignorés > 30 j")}
              value={openOld.length}
              alert={openOld.length > 0}
            />
            <SynthItem
              label={t("Démarches bailleur")}
              value={steps.length}
            />
          </section>
        ) : null}

        {/* Chronologie des démarches vis-à-vis du bailleur */}
        {steps.length > 0 ? (
          <section className="mb-8 break-inside-avoid">
            <h2 className="mb-3 text-lg font-bold text-gray-900">
              {t("Chronologie des démarches")}
            </h2>
            <ol className="space-y-2 border-l-2 border-gray-200 pl-4">
              {steps.map((s) => (
                <li key={s.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900">
                      {formatDate(s.occurredAt)}
                    </span>{" "}
                    — <span className="text-gray-700">{t(landlordStepLabels[s.type])}</span>{" "}
                    : {s.title}
                  </div>
                  {s.detail ? (
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-600">
                      {s.detail}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {incidents.length === 0 ? (
          <p className="text-gray-500">{t("Aucun signalement pour ce périmètre.")}</p>
        ) : (
          <>
          <h2 className="mb-3 text-lg font-bold text-gray-900">
            {t("Détail des signalements")}
          </h2>
          <ol className="space-y-6">
            {incidents.map((i, idx) => (
              <li key={i.id} className="break-inside-avoid">
                <h2 className="text-lg font-bold text-gray-900">
                  {idx + 1}. {i.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t(incidentCategoryLabels[i.category])} ·{" "}
                  {t(incidentStatusLabels[i.status])} · {t(i.building.name)}
                  {i.unit ? ` · ${i.unit.label}` : ""} ·{" "}
                  {formatDateTime(i.createdAt)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-gray-800">
                  {i.description}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {t("Signalé par")}{" "}
                  {i.anonymous
                    ? t("Anonyme")
                    : `${i.author.firstName} ${i.author.lastName}`}
                </p>
                {i.resolvedAt ? (
                  <p className="mt-1 text-xs font-medium text-green-700">
                    ✅ {t("Résolu le")} {formatDate(i.resolvedAt)}
                  </p>
                ) : i.landlordPromiseAt && i.landlordPromiseAt < new Date() ? (
                  <p className="mt-1 text-xs font-semibold text-rose-700">
                    ⛔ {t("Promesse non tenue")} —{" "}
                    {t("intervention promise pour le")}{" "}
                    {formatDate(i.landlordPromiseAt)}
                  </p>
                ) : i.landlordPromiseAt ? (
                  <p className="mt-1 text-xs text-amber-700">
                    🕒 {t("Intervention promise pour le")}{" "}
                    {formatDate(i.landlordPromiseAt)}
                  </p>
                ) : null}
                {i.photos.filter((p) => !p.filePath.endsWith(".pdf")).length >
                0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {i.photos
                      .filter((p) => !p.filePath.endsWith(".pdf"))
                      .map((p) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={p.id}
                          src={publicFileUrl(p.filePath)}
                          alt="Preuve"
                          className="h-32 w-full rounded border border-gray-200 object-cover"
                        />
                      ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
          </>
        )}

        <footer className="mt-8 border-t border-gray-200 pt-4 text-xs text-gray-500">
          <p>
            {t(
              "Document constitué par le collectif des locataires à partir des signalements horodatés de ses membres. Les photographies jointes sont produites à titre de preuve. Ce dossier peut être communiqué au bailleur, à la commission départementale de conciliation, aux services de la mairie ou au tribunal judiciaire.",
            )}
          </p>
        </footer>
      </article>
    </div>
  );
}

function SynthItem({
  label,
  value,
  alert,
}: {
  label: string;
  value: string | number;
  alert?: boolean;
}) {
  return (
    <div>
      <div
        className={`text-xl font-bold ${alert ? "text-rose-700" : "text-gray-900"}`}
      >
        {value}
      </div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
    </div>
  );
}
