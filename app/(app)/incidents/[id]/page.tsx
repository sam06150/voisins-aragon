import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isStaff } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { scopeFor, buildingScopeWhere } from "@/lib/tenancy";
import { Alert, Badge, Button, Card, Select } from "@/components/ui";
import {
  formatDate,
  formatDateTime,
  incidentCategoryLabels,
  incidentStatusColors,
  incidentStatusLabels,
} from "@/lib/labels";
import { incidentStatuses } from "@/lib/validation";
import { publicFileUrl } from "@/lib/storage";
import ConfirmButton from "@/components/ConfirmButton";
import {
  deleteIncident,
  toggleSupport,
  updateIncidentStatus,
  setIncidentPromise,
} from "../actions";

export default async function IncidentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();
  const { id } = await params;
  const { ok, error } = await searchParams;

  const incident = await prisma.incidentReport.findFirst({
    // 404 si le signalement est hors de la résidence de l'utilisateur.
    where: { AND: [buildingScopeWhere(scope), { id }] },
    include: {
      building: true,
      unit: true,
      author: { select: { id: true, firstName: true, lastName: true } },
      photos: true,
      supports: true,
    },
  });
  if (!incident) notFound();

  const isAdmin = isStaff(user.role);
  const canDelete = incident.authorId === user.id || isAdmin;
  const supportCount = incident.supports.length;
  const iSupport = incident.supports.some((s) => s.userId === user.id);
  const images = incident.photos.filter((p) => !p.filePath.endsWith(".pdf"));
  const pdfs = incident.photos.filter((p) => p.filePath.endsWith(".pdf"));

  // Suivi de résolution : promesse du bailleur vs réalité.
  const promiseBroken =
    incident.landlordPromiseAt !== null &&
    incident.resolvedAt === null &&
    incident.landlordPromiseAt < new Date();
  const resolutionDays =
    incident.resolvedAt !== null
      ? Math.max(
          0,
          Math.round(
            (incident.resolvedAt.getTime() - incident.createdAt.getTime()) /
              (24 * 60 * 60 * 1000),
          ),
        )
      : null;
  // Valeur pour l'input date (YYYY-MM-DD).
  const promiseInput = incident.landlordPromiseAt
    ? incident.landlordPromiseAt.toISOString().slice(0, 10)
    : "";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/incidents"
        className="mb-4 inline-block text-sm text-gray-500 hover:underline"
      >
        ← {t("Retour aux signalements")}
      </Link>

      {ok ? (
        <div className="mb-4">
          <Alert kind="success">{t("Statut mis à jour.")}</Alert>
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <Alert kind="error">{t("Impossible de mettre à jour le statut.")}</Alert>
        </div>
      ) : null}

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className={incidentStatusColors[incident.status]}>
            {t(incidentStatusLabels[incident.status])}
          </Badge>
          <Badge className="border-gray-200 bg-gray-50 text-gray-600">
            {t(incidentCategoryLabels[incident.category])}
          </Badge>
          <Badge className="border-gray-200 bg-gray-50 text-gray-600">
            {t(incident.building.name)}
            {incident.unit ? ` · ${incident.unit.label}` : ""}
          </Badge>
        </div>

        <h1 className="text-xl font-bold text-gray-900">{incident.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-gray-700">
          {incident.description}
        </p>

        {incident.resolvedAt ? (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            ✅ {t("Résolu le")} {formatDate(incident.resolvedAt)}
            {resolutionDays !== null
              ? ` · ${t("en")} ${resolutionDays} ${t("jour(s)")}`
              : ""}
          </div>
        ) : promiseBroken ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
            ⛔ {t("Promesse non tenue")} —{" "}
            {t("le bailleur s'était engagé pour le")}{" "}
            {formatDate(incident.landlordPromiseAt!)}
          </div>
        ) : incident.landlordPromiseAt ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            🕒 {t("Intervention promise par le bailleur pour le")}{" "}
            {formatDate(incident.landlordPromiseAt)}
          </div>
        ) : null}

        {images.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((p) => (
              <a
                key={p.id}
                href={publicFileUrl(p.filePath)}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publicFileUrl(p.filePath)}
                  alt="Photo du signalement"
                  className="h-32 w-full object-cover"
                />
              </a>
            ))}
          </div>
        ) : null}

        {pdfs.length > 0 ? (
          <div className="mt-4 space-y-2">
            {pdfs.map((p) => (
              <a
                key={p.id}
                href={publicFileUrl(p.filePath)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-rose-700 hover:underline"
              >
                📄 {t("Document joint (PDF)")}
              </a>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500">
            {t("Signalé par")}{" "}
            {incident.anonymous
              ? `🕶️ ${t("Anonyme")}`
              : `${incident.author.firstName} ${incident.author.lastName}`}{" "}
            · {formatDateTime(incident.createdAt)}
          </p>
          <form action={toggleSupport}>
            <input type="hidden" name="incidentId" value={incident.id} />
            <button
              type="submit"
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                iSupport
                  ? "border-rose-400 bg-rose-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              ✊ {iSupport ? t("Je soutiens") : t("Soutenir")}
              {supportCount > 0 ? (
                <span className="opacity-80">· {supportCount}</span>
              ) : null}
            </button>
          </form>
        </div>
      </Card>

      {canDelete ? (
        <div className="mt-4 flex justify-end">
          <form action={deleteIncident}>
            <input type="hidden" name="incidentId" value={incident.id} />
            <ConfirmButton
              variant="ghost"
              confirmMessage={t(
                "Supprimer définitivement ce signalement et ses photos ?",
              )}
            >
              🗑️ {t("Supprimer le signalement")}
            </ConfirmButton>
          </form>
        </div>
      ) : null}

      {isAdmin ? (
        <Card className="mt-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">
            {t("Modération — changer le statut")}
          </h2>
          <form
            action={updateIncidentStatus}
            className="flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="incidentId" value={incident.id} />
            <div className="min-w-40">
              <Select name="status" defaultValue={incident.status}>
                {incidentStatuses.map((s) => (
                  <option key={s} value={s}>
                    {t(incidentStatusLabels[s])}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary">
              {t("Enregistrer")}
            </Button>
          </form>

          <h2 className="mb-2 mt-5 text-sm font-semibold text-gray-800">
            {t("Date d'intervention promise par le bailleur")}
          </h2>
          <form
            action={setIncidentPromise}
            className="flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="incidentId" value={incident.id} />
            <input
              type="date"
              name="promiseAt"
              defaultValue={promiseInput}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            />
            <Button type="submit" variant="secondary">
              {t("Enregistrer")}
            </Button>
            <span className="text-xs text-gray-500">
              {t("Laisser vide pour effacer.")}
            </span>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
