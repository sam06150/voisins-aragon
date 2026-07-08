import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isStaff } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { Alert, Badge, Button, Card, Select } from "@/components/ui";
import {
  formatDateTime,
  incidentCategoryLabels,
  incidentStatusColors,
  incidentStatusLabels,
} from "@/lib/labels";
import { incidentStatuses } from "@/lib/validation";
import { publicFileUrl } from "@/lib/storage";
import { toggleSupport, updateIncidentStatus } from "../actions";

export default async function IncidentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireApproved();
  const { t } = await getI18n();
  const { id } = await params;
  const { ok, error } = await searchParams;

  const incident = await prisma.incidentReport.findUnique({
    where: { id },
    include: {
      building: true,
      unit: true,
      author: true,
      photos: true,
      supports: true,
    },
  });
  if (!incident) notFound();

  const isAdmin = isStaff(user.role);
  const supportCount = incident.supports.length;
  const iSupport = incident.supports.some((s) => s.userId === user.id);
  const images = incident.photos.filter((p) => !p.filePath.endsWith(".pdf"));
  const pdfs = incident.photos.filter((p) => p.filePath.endsWith(".pdf"));

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
          <p className="text-xs text-gray-400">
            {t("Signalé par")} {incident.author.firstName}{" "}
            {incident.author.lastName} · {formatDateTime(incident.createdAt)}
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
        </Card>
      ) : null}
    </div>
  );
}
