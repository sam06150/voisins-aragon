import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { scopeFor, buildingScopeWhere, buildingsFor } from "@/lib/tenancy";
import { publicFileUrl } from "@/lib/storage";
import { Select } from "@/components/ui";
import PrintButton from "@/components/PrintButton";
import {
  formatDate,
  formatDateTime,
  incidentCategoryLabels,
  incidentStatusLabels,
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

  const incidents = await prisma.incidentReport.findMany({
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
  });

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
            {incidents.length} {t("signalement(s)")}
          </p>
        </header>

        {incidents.length === 0 ? (
          <p className="text-gray-500">{t("Aucun signalement pour ce périmètre.")}</p>
        ) : (
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
                  {t("Signalé par")} {i.author.firstName} {i.author.lastName}
                </p>
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
        )}
      </article>
    </div>
  );
}
