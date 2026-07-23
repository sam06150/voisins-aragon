import type { JoinRequestKind, JoinRequestStatus } from "@prisma/client";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Alert, Badge, Button, EmptyState, Select, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/labels";
import { updateJoinRequest } from "../actions";

const KIND_LABELS: Record<JoinRequestKind, string> = {
  REFERENT: "Référent",
  LOCATAIRE: "Locataire",
};

const STATUS_LABELS: Record<JoinRequestStatus, string> = {
  NOUVEAU: "Nouveau",
  CONTACTE: "Contacté",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
};

const STATUS_COLORS: Record<JoinRequestStatus, string> = {
  NOUVEAU: "border-amber-300 bg-amber-50 text-amber-800",
  CONTACTE: "border-blue-300 bg-blue-50 text-blue-800",
  ACCEPTE: "border-green-300 bg-green-50 text-green-800",
  REFUSE: "border-gray-300 bg-gray-50 text-gray-600",
};

export default async function CandidaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string; cok?: string; cerror?: string }>;
}) {
  await requireStaff();
  const sp = await searchParams;

  const kindFilter =
    sp.kind === "REFERENT" || sp.kind === "LOCATAIRE"
      ? (sp.kind as JoinRequestKind)
      : undefined;
  const statusFilter =
    sp.status && sp.status in STATUS_LABELS
      ? (sp.status as JoinRequestStatus)
      : undefined;

  const [requests, counts] = await Promise.all([
    prisma.joinRequest.findMany({
      where: { kind: kindFilter, status: statusFilter },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.joinRequest.groupBy({
      by: ["kind", "status"],
      _count: { _all: true },
    }),
  ]);

  const referentNew = counts
    .filter((c) => c.kind === "REFERENT" && c.status === "NOUVEAU")
    .reduce((n, c) => n + c._count._all, 0);
  const locataireNew = counts
    .filter((c) => c.kind === "LOCATAIRE" && c.status === "NOUVEAU")
    .reduce((n, c) => n + c._count._all, 0);

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-gray-900">
        Candidatures publiques
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        Demandes déposées depuis les pages publiques /rejoindre et /referent.
        Ce ne sont pas des comptes : personne n&apos;a accès à la plateforme
        tant que vous n&apos;avez pas créé son accès.
      </p>

      {sp.cok ? (
        <div className="mb-4">
          <Alert kind="success">Candidature mise à jour.</Alert>
        </div>
      ) : null}
      {sp.cerror ? (
        <div className="mb-4">
          <Alert kind="error">Mise à jour impossible.</Alert>
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile value={referentNew} label="Référents à traiter" highlight />
        <Tile value={locataireNew} label="Locataires à traiter" />
        <Tile
          value={counts
            .filter((c) => c.status === "ACCEPTE")
            .reduce((n, c) => n + c._count._all, 0)}
          label="Acceptées"
        />
        <Tile
          value={counts.reduce((n, c) => n + c._count._all, 0)}
          label="Total"
        />
      </div>

      <nav className="mb-5 flex flex-wrap gap-2 text-sm">
        <FilterLink href="/admin/candidatures" label="Toutes" />
        <FilterLink
          href="/admin/candidatures?kind=REFERENT"
          label="Référents"
        />
        <FilterLink
          href="/admin/candidatures?kind=LOCATAIRE"
          label="Locataires"
        />
        <FilterLink
          href="/admin/candidatures?status=NOUVEAU"
          label="Non traitées"
        />
      </nav>

      {requests.length === 0 ? (
        <EmptyState>Aucune candidature pour l&apos;instant.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-gray-900">
                      {r.firstName} {r.lastName}
                    </span>
                    <Badge
                      className={
                        r.kind === "REFERENT"
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-gray-300 bg-gray-50 text-gray-700"
                      }
                    >
                      {KIND_LABELS[r.kind]}
                    </Badge>
                    <Badge className={STATUS_COLORS[r.status]}>
                      {STATUS_LABELS[r.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">
                    {r.residenceName}
                    {r.buildingName ? ` — ${r.buildingName}` : ""} ·{" "}
                    {r.postalCode ? `${r.postalCode} ` : ""}
                    {r.city} ({r.country})
                    {r.landlord ? ` · Bailleur : ${r.landlord}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    <a
                      href={`mailto:${r.email}`}
                      className="text-rose-700 hover:underline"
                    >
                      {r.email}
                    </a>
                    {r.phone ? ` · ${r.phone}` : ""} ·{" "}
                    {formatDateTime(r.createdAt)}
                  </p>
                  {r.message ? (
                    <p className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      {r.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <form
                action={updateJoinRequest}
                className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="id" value={r.id} />
                <div className="sm:w-44">
                  <label
                    htmlFor={`status-${r.id}`}
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Statut
                  </label>
                  <Select
                    id={`status-${r.id}`}
                    name="status"
                    defaultValue={r.status}
                  >
                    {Object.entries(STATUS_LABELS).map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor={`note-${r.id}`}
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Note interne
                  </label>
                  <Textarea
                    id={`note-${r.id}`}
                    name="handledNote"
                    rows={2}
                    className="min-h-0"
                    defaultValue={r.handledNote ?? ""}
                    placeholder="Ex : appelé le 12/08, ouvre le bâtiment B"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Enregistrer
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tile({
  value,
  label,
  highlight = false,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        highlight && value > 0
          ? "border-amber-300 bg-amber-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-xs font-medium text-gray-500">{label}</div>
    </div>
  );
}

function FilterLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rounded-md bg-white px-3 py-1.5 font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
    >
      {label}
    </a>
  );
}
