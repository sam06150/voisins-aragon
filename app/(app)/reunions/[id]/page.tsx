import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isManager } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { Alert, Badge, Button, Card, LinkButton, Textarea } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import {
  documentCategoryLabels,
  formatDateTime,
  rsvpLabels,
} from "@/lib/labels";
import { deleteMeeting, setRsvp, updateMinutes } from "../actions";

export default async function ReunionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireApproved();
  const { t } = await getI18n();
  const isAdmin = isManager(user.role);
  const { id } = await params;
  const { ok, error } = await searchParams;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      building: true,
      author: true,
      documents: true,
      rsvps: true,
    },
  });
  if (!meeting) notFound();

  const myRsvp = meeting.rsvps.find((r) => r.userId === user.id)?.status ?? null;
  const rsvpCounts = {
    OUI: meeting.rsvps.filter((r) => r.status === "OUI").length,
    NON: meeting.rsvps.filter((r) => r.status === "NON").length,
    PEUTETRE: meeting.rsvps.filter((r) => r.status === "PEUTETRE").length,
  };
  const rsvpOptions = ["OUI", "PEUTETRE", "NON"] as const;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/reunions"
        className="mb-4 inline-block text-sm text-gray-500 hover:underline"
      >
        ← {t("Retour aux réunions")}
      </Link>

      {ok ? (
        <div className="mb-4">
          <Alert kind="success">{t("Compte-rendu enregistré.")}</Alert>
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <Alert kind="error">{t("Une erreur est survenue.")}</Alert>
        </div>
      ) : null}

      <Card>
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <Badge className="border-gray-200 bg-gray-50 text-gray-600">
              {meeting.building ? t(meeting.building.name) : t("Toutes résidences")}
            </Badge>
            <h1 className="mt-2 text-xl font-bold text-gray-900">
              {meeting.title}
            </h1>
          </div>
          {isAdmin ? (
            <form action={deleteMeeting}>
              <input type="hidden" name="meetingId" value={meeting.id} />
              <ConfirmButton
                variant="ghost"
                confirmMessage={t("Supprimer cette réunion ?")}
              >
                {t("Supprimer")}
              </ConfirmButton>
            </form>
          ) : null}
        </div>

        <p className="text-sm text-gray-600">
          🗓️ {formatDateTime(meeting.scheduledAt)}
          {meeting.location ? ` · 📍 ${meeting.location}` : ""}
        </p>

        {meeting.agenda ? (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-800">
              {t("Ordre du jour")}
            </h2>
            <p className="mt-1 whitespace-pre-wrap text-gray-700">
              {meeting.agenda}
            </p>
          </div>
        ) : null}

        {meeting.minutesText ? (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-gray-800">
              {t("Compte-rendu")}
            </h2>
            <p className="mt-1 whitespace-pre-wrap text-gray-700">
              {meeting.minutesText}
            </p>
          </div>
        ) : null}

        {meeting.documents.length > 0 ? (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-800">
              {t("Documents joints")}
            </h2>
            <ul className="space-y-1">
              {meeting.documents.map((d) => (
                <li key={d.id}>
                  <a
                    href={`/api/uploads/${d.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-rose-700 hover:underline"
                  >
                    📄 {d.title}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      ({t(documentCategoryLabels[d.category])})
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5 border-t border-gray-100 pt-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-800">
            {t("Serez-vous présent ?")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {rsvpOptions.map((status) => (
              <form key={status} action={setRsvp}>
                <input type="hidden" name="meetingId" value={meeting.id} />
                <input type="hidden" name="status" value={status} />
                <button
                  type="submit"
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    myRsvp === status
                      ? "border-rose-400 bg-rose-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t(rsvpLabels[status])}
                  <span className="ml-1 opacity-70">
                    ({rsvpCounts[status]})
                  </span>
                </button>
              </form>
            ))}
          </div>
        </div>

        <p className="mt-5 border-t border-gray-100 pt-4 text-xs text-gray-400">
          {t("Créée par")} {meeting.author.firstName} {meeting.author.lastName}
        </p>
      </Card>

      {isAdmin ? (
        <Card className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">
              {t("Compte-rendu (texte)")}
            </h2>
            <LinkButton
              href={`/documents/nouveau?reunion=${meeting.id}`}
              variant="secondary"
            >
              + {t("Joindre un document")}
            </LinkButton>
          </div>
          <form action={updateMinutes} className="space-y-3">
            <input type="hidden" name="meetingId" value={meeting.id} />
            <Textarea
              name="minutesText"
              defaultValue={meeting.minutesText ?? ""}
              placeholder={t("Saisissez le compte-rendu de la réunion…")}
            />
            <Button type="submit" variant="secondary">
              {t("Enregistrer le compte-rendu")}
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
