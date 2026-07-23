import type { Role } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isAdmin, isManager, rank } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { scopeFor } from "@/lib/tenancy";
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  LinkButton,
  Select,
} from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import { formatDate, formatDateTime, roleLabels } from "@/lib/labels";
import { DELETED_EMAIL_PREFIX } from "@/lib/accounts";
import { isOnline } from "@/lib/presence";
import {
  deleteUser,
  reactivateUser,
  resetUserPassword,
  setUserRole,
  suspendUser,
} from "../../actions";

const ASSIGNABLE_ROLES: Role[] = ["TENANT", "MODERATOR", "SUBADMIN", "ADMIN"];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-gray-100 py-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center">
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

export default async function VoisinFichePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editok?: string; editerror?: string }>;
}) {
  const admin = await requireStaff();
  const scope = scopeFor(admin);
  const { t } = await getI18n();
  const { id } = await params;
  const { editok, editerror } = await searchParams;
  const manager = isManager(admin.role);
  const canManageRoles = isAdmin(admin.role);

  const user = await prisma.user.findFirst({
    // 404 si le compte est hors de la résidence de l'administrateur — mais un
    // compte non encore rattaché (residenceId null, inscription à valider) reste
    // accessible pour pouvoir le traiter.
    where: {
      AND: [
        scope.kind === "residence"
          ? { OR: [{ residenceId: scope.residenceId }, { residenceId: null }] }
          : {},
        { id },
      ],
    },
    include: {
      unit: { include: { building: { include: { residence: true } } } },
      _count: {
        select: {
          incidents: true,
          forumThreads: true,
          forumPosts: true,
          petitions: true,
          petitionSignatures: true,
          polls: true,
          pollVotes: true,
          meetings: true,
          meetingRsvps: true,
          incidentSupports: true,
          documents: true,
          announcements: true,
          helpOffers: true,
        },
      },
    },
  });

  if (!user || user.email.startsWith(DELETED_EMAIL_PREFIX)) notFound();

  const [incidents, threads] = await Promise.all([
    prisma.incidentReport.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, createdAt: true },
    }),
    prisma.forumThread.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true, categoryId: true },
    }),
  ]);

  const online = isOnline(user.lastSeenAt);
  const actionable = rank(admin.role) > rank(user.role);
  const c = user._count;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/comptes"
          className="text-sm text-gray-500 hover:underline"
        >
          ← {t("Retour aux comptes")}
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {user.firstName} {user.lastName}
          </h1>
          {canManageRoles && actionable ? (
            <LinkButton href={`/admin/comptes/${user.id}/modifier`}>
              ✏️ {t("Modifier")}
            </LinkButton>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {user.status === "APPROVED" ? (
            <Badge className="border-green-200 bg-green-50 text-green-700">
              {t("Approuvé")}
            </Badge>
          ) : user.status === "PENDING" ? (
            <Badge className="border-amber-200 bg-amber-50 text-amber-800">
              {t("En attente")}
            </Badge>
          ) : user.status === "SUSPENDED" ? (
            <Badge className="border-amber-200 bg-amber-50 text-amber-800">
              {t("En veille")}
            </Badge>
          ) : (
            <Badge className="border-red-200 bg-red-50 text-red-700">
              {t("Refusé")}
            </Badge>
          )}
          <Badge className="border-gray-200 bg-gray-50 text-gray-600">
            {t(roleLabels[user.role])}
          </Badge>
          {online ? (
            <Badge className="border-green-200 bg-green-50 text-green-700">
              🟢 {t("En ligne")}
            </Badge>
          ) : null}
        </div>
      </div>

      {editok ? (
        <Alert kind="success">{t("Fiche mise à jour.")}</Alert>
      ) : null}
      {editerror ? (
        <Alert kind="error">
          {editerror === "rank"
            ? t("Vous ne pouvez agir que sur un compte de rôle inférieur au vôtre.")
            : t("La modification n'a pas pu être enregistrée.")}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            {t("Coordonnées")}
          </h2>
          <Row label={t("E-mail")} value={user.email} />
          <Row label={t("Téléphone")} value={user.phone ?? "—"} />
          <Row label={t("Inscrit le")} value={formatDate(user.createdAt)} />
          <Row
            label={t("Dernière activité")}
            value={
              user.lastSeenAt ? formatDateTime(user.lastSeenAt) : t("Jamais")
            }
          />
        </Card>

        <Card>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            {t("Logement")}
          </h2>
          <Row
            label={t("Résidence")}
            value={
              user.unit?.building.residence?.name ??
              user.signupResidenceName ??
              "—"
            }
          />
          <Row
            label={t("Bâtiment")}
            value={
              user.unit
                ? t(user.unit.building.name)
                : (user.signupBuildingName ?? "—")
            }
          />
          <Row
            label={t("Logement")}
            value={user.unit?.label ?? user.signupUnitLabel ?? "—"}
          />
          <Row
            label={t("Étage")}
            value={user.unit ? String(user.unit.floor) : "—"}
          />
          {!user.unit ? (
            <p className="mt-2 text-xs text-amber-700">
              {t(
                "Aucun logement rattaché — les valeurs affichées sont celles déclarées à l'inscription.",
              )}
            </p>
          ) : null}
        </Card>

        <Card>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            {t("Confidentialité")}
          </h2>
          <Row
            label={t("Visible dans l'annuaire")}
            value={user.shareInDirectory ? t("Oui") : t("Non")}
          />
          <Row
            label={t("Partage son e-mail")}
            value={user.shareEmail ? t("Oui") : t("Non")}
          />
          <Row
            label={t("Partage son téléphone")}
            value={user.sharePhone ? t("Oui") : t("Non")}
          />
          <Row
            label={t("Notifications par e-mail")}
            value={user.emailNotifications ? t("Oui") : t("Non")}
          />
          <Row
            label={t("Consentement RGPD")}
            value={user.consentAt ? formatDate(user.consentAt) : t("Non signé")}
          />
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            {t("Participation")}
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <Stat label={t("Signalements")} value={c.incidents} />
            <Stat label={t("Soutiens")} value={c.incidentSupports} />
            <Stat label={t("Sujets")} value={c.forumThreads} />
            <Stat label={t("Messages")} value={c.forumPosts} />
            <Stat label={t("Pétitions")} value={c.petitions} />
            <Stat label={t("Signatures")} value={c.petitionSignatures} />
            <Stat label={t("Sondages")} value={c.polls} />
            <Stat label={t("Votes")} value={c.pollVotes} />
            <Stat label={t("Réunions")} value={c.meetings} />
            <Stat label={t("Présences")} value={c.meetingRsvps} />
            <Stat label={t("Documents")} value={c.documents} />
            <Stat label={t("Annonces")} value={c.announcements} />
            <Stat label={t("Coups de main")} value={c.helpOffers} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            {t("Derniers signalements")}
          </h2>
          {incidents.length === 0 ? (
            <p className="text-sm text-gray-500">{t("Aucun signalement.")}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {incidents.map((i) => (
                <li key={i.id} className="py-2 text-sm">
                  <Link
                    href={`/incidents/${i.id}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {i.title}
                  </Link>
                  <div className="text-xs text-gray-500">
                    {formatDate(i.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            {t("Derniers sujets du forum")}
          </h2>
          {threads.length === 0 ? (
            <p className="text-sm text-gray-500">{t("Aucun sujet.")}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {threads.map((th) => (
                <li key={th.id} className="py-2 text-sm">
                  <Link
                    href={`/forum/${th.categoryId}/${th.id}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {th.title}
                  </Link>
                  <div className="text-xs text-gray-500">
                    {formatDate(th.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
          {t("Administration")}
        </h2>
        {!actionable && !canManageRoles ? (
          <Alert kind="info">
            {t("Vous ne pouvez agir que sur un compte de rôle inférieur au vôtre.")}
          </Alert>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {manager && user.status === "APPROVED" ? (
            <form
              action={resetUserPassword}
              className="flex flex-1 items-end gap-2"
            >
              <input type="hidden" name="userId" value={user.id} />
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">
                  {t("Nouveau mot de passe")}
                </label>
                <Input
                  name="newPassword"
                  type="text"
                  aria-label={t("Nouveau mot de passe")}
                  placeholder={t("8 caractères min.")}
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" variant="secondary">
                {t("Réinitialiser")}
              </Button>
            </form>
          ) : null}

          {canManageRoles && user.id !== admin.id ? (
            <form action={setUserRole} className="flex items-end gap-2">
              <input type="hidden" name="userId" value={user.id} />
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  {t("Rôle")}
                </label>
                <Select name="role" aria-label={t("Rôle")} defaultValue={user.role}>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(roleLabels[r])}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit" variant="secondary">
                {t("Appliquer")}
              </Button>
            </form>
          ) : null}

          {manager && actionable && user.status === "APPROVED" ? (
            <form action={suspendUser}>
              <input type="hidden" name="userId" value={user.id} />
              <ConfirmButton
                variant="neutral"
                confirmMessage={t(
                  "Mettre ce compte en veille ? L'accès sera suspendu, mais le compte et ses données sont conservés (réversible).",
                )}
              >
                {t("Mettre en veille")}
              </ConfirmButton>
            </form>
          ) : null}

          {manager && actionable && user.status === "SUSPENDED" ? (
            <form action={reactivateUser}>
              <input type="hidden" name="userId" value={user.id} />
              <Button type="submit" variant="secondary">
                {t("Réactiver le compte")}
              </Button>
            </form>
          ) : null}

          {actionable ? (
            <form action={deleteUser}>
              <input type="hidden" name="userId" value={user.id} />
              <ConfirmButton
                variant="danger"
                confirmMessage={t(
                  "Supprimer ce compte ? Les données personnelles et l'accès seront effacés (les contributions restent anonymes).",
                )}
              >
                {t("Supprimer le compte")}
              </ConfirmButton>
            </form>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
