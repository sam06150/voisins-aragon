import type { Role } from "@prisma/client";
import { requireStaff } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isAdmin, isManager, rank } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { Alert, Badge, Button, Card, EmptyState, Input, Select } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import { formatDate, roleLabels } from "@/lib/labels";
import { DELETED_EMAIL_PREFIX } from "@/lib/accounts";
import {
  approveAccount,
  deleteUser,
  reactivateUser,
  resetUserPassword,
  setUserRole,
  suspendUser,
} from "../actions";

const ASSIGNABLE_ROLES: Role[] = ["TENANT", "MODERATOR", "SUBADMIN", "ADMIN"];

export default async function AdminComptesPage({
  searchParams,
}: {
  searchParams: Promise<{
    pwok?: string;
    pwerror?: string;
    roleok?: string;
    roleerror?: string;
    delok?: string;
    delerror?: string;
    suok?: string;
    suerror?: string;
    error?: string;
  }>;
}) {
  const admin = await requireStaff();
  const { t } = await getI18n();
  const manager = isManager(admin.role);
  const canManageRoles = isAdmin(admin.role);
  const {
    pwok,
    pwerror,
    roleok,
    roleerror,
    delok,
    delerror,
    suok,
    suerror,
    error,
  } = await searchParams;

  const notDeleted = { email: { not: { startsWith: DELETED_EMAIL_PREFIX } } };

  const [pending, others, buildings, units] = await Promise.all([
    prisma.user.findMany({
      where: { status: "PENDING", ...notDeleted },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: {
        status: { in: ["APPROVED", "REJECTED", "SUSPENDED"] },
        ...notDeleted,
      },
      include: { unit: { include: { building: true } } },
      orderBy: [{ status: "asc" }, { lastName: "asc" }],
    }),
    prisma.building.findMany({ orderBy: { code: "asc" } }),
    prisma.unit.findMany({
      orderBy: [{ floor: "asc" }, { label: "asc" }],
      include: { building: true },
    }),
  ]);

  const buildingName = (id: string | null) =>
    buildings.find((b) => b.id === id)?.name ?? "—";

  return (
    <div>
      {manager ? (
        <>
      <h2 className="mb-1 text-xl font-bold text-gray-900">
        {t("Validation des inscriptions")}
      </h2>
      <p className="mb-5 text-sm text-gray-600">
        {t(
          "Vérifiez que la personne est bien locataire de la résidence avant de valider son compte. Vous pouvez rattacher son logement au passage.",
        )}
      </p>

      {error ? (
        <div className="mb-4">
          <Alert kind="error">
            {error === "code"
              ? t("Indiquez le code du nouveau bâtiment (ex : A).")
              : error === "dup"
                ? t(
                    "Ce bâtiment ou cette résidence existe déjà — sélectionnez-le dans la liste.",
                  )
                : error === "unit"
                  ? t("Logement introuvable.")
                  : t("Une erreur est survenue.")}
          </Alert>
        </div>
      ) : null}

      {pending.length === 0 ? (
        <EmptyState>{t("Aucune inscription en attente.")} 🎉</EmptyState>
      ) : (
        <div className="space-y-4">
          {pending.map((u) => {
            const unitsForBuilding = units.filter(
              (unit) => unit.buildingId === u.signupBuildingId,
            );
            return (
              <Card key={u.id}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {u.firstName} {u.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                    {u.phone ? (
                      <div className="text-sm text-gray-500">📞 {u.phone}</div>
                    ) : null}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Inscrit le {formatDate(u.createdAt)}</div>
                    <Badge className="mt-1 border-amber-200 bg-amber-50 text-amber-800">
                      {t("Déclaré :")}{" "}
                      {u.signupResidenceName ? `${u.signupResidenceName} · ` : ""}
                      {u.signupBuildingId
                        ? t(buildingName(u.signupBuildingId))
                        : (u.signupBuildingName ?? "?")}{" "}
                      · {u.signupUnitLabel ?? "?"}
                    </Badge>
                  </div>
                </div>

                <form
                  action={approveAccount}
                  className="rounded-lg bg-gray-50 p-3"
                >
                  <input type="hidden" name="userId" value={u.id} />
                  <p className="mb-2 text-xs font-medium text-gray-600">
                    {t("Rattacher un logement (facultatif)")}
                  </p>
                  <div className="mb-3">
                    <label className="mb-1 block text-xs text-gray-500">
                      {t("Bâtiment")}
                    </label>
                    <Select
                      name="buildingId"
                      aria-label={t("Bâtiment")}
                      defaultValue={u.signupBuildingId ?? ""}
                    >
                      <option value="">{t("— Choisir —")}</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {t(b.name)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <p className="mb-1 text-xs text-gray-500">
                    {t(
                      "…ou créez le bâtiment (et sa résidence) si absent de la liste :",
                    )}
                  </p>
                  <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        {t("Nouvelle résidence")}
                      </label>
                      <Input
                        name="newResidenceName"
                        aria-label={t("Nouvelle résidence")}
                        placeholder={t("Nom (facultatif)")}
                        defaultValue={u.signupResidenceName ?? ""}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        {t("Nouveau bâtiment")}
                      </label>
                      <Input
                        name="newBuildingName"
                        aria-label={t("Nouveau bâtiment")}
                        placeholder={t("Nom")}
                        defaultValue={u.signupBuildingName ?? ""}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        {t("Code bâtiment")}
                      </label>
                      <Input
                        name="newBuildingCode"
                        aria-label={t("Code bâtiment")}
                        placeholder={t("Ex : A")}
                      />
                    </div>
                  </div>
                  <p className="mb-1 text-xs font-medium text-gray-600">
                    {t("Logement")}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        {t("Logement existant")}
                      </label>
                      <Select
                        name="unitId"
                        aria-label={t("Logement existant")}
                        defaultValue=""
                      >
                        <option value="">{t("— Aucun / créer ci-dessous —")}</option>
                        {unitsForBuilding.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.label} ({t("étage")} {unit.floor})
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        {t("…ou nouvel étage")}
                      </label>
                      <Input
                        name="newFloor"
                        type="number"
                        aria-label={t("…ou nouvel étage")}
                        placeholder={t("Ex : 3")}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        {t("…et libellé")}
                      </label>
                      <Input
                        name="newUnitLabel"
                        aria-label={t("…et libellé")}
                        placeholder={t("Ex : 3B")}
                        defaultValue={u.signupUnitLabel ?? ""}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="submit" name="action" value="approve">
                      ✓ {t("Valider le compte")}
                    </Button>
                    <ConfirmButton
                      name="action"
                      value="reject"
                      confirmMessage={t("Refuser cette inscription ?")}
                    >
                      {t("Refuser")}
                    </ConfirmButton>
                  </div>
                </form>
              </Card>
            );
          })}
        </div>
      )}
        </>
      ) : null}

      <h2 className="mb-3 mt-10 text-xl font-bold text-gray-900">
        {t("Comptes traités")}
      </h2>

      {pwok ? (
        <div className="mb-4">
          <Alert kind="success">{t("Mot de passe réinitialisé.")}</Alert>
        </div>
      ) : null}
      {pwerror ? (
        <div className="mb-4">
          <Alert kind="error">
            {pwerror === "self"
              ? t("Utilisez « Mon compte » pour changer votre propre mot de passe.")
              : t("Mot de passe trop court (8 caractères minimum).")}
          </Alert>
        </div>
      ) : null}
      {roleok ? (
        <div className="mb-4">
          <Alert kind="success">{t("Rôle mis à jour.")}</Alert>
        </div>
      ) : null}
      {roleerror ? (
        <div className="mb-4">
          <Alert kind="error">
            {t("Vous ne pouvez pas retirer votre propre rôle de référent.")}
          </Alert>
        </div>
      ) : null}
      {delok ? (
        <div className="mb-4">
          <Alert kind="success">{t("Compte supprimé.")}</Alert>
        </div>
      ) : null}
      {suok ? (
        <div className="mb-4">
          <Alert kind="success">{t("Statut du compte mis à jour.")}</Alert>
        </div>
      ) : null}
      {suerror ? (
        <div className="mb-4">
          <Alert kind="error">
            {suerror === "self"
              ? t("Vous ne pouvez pas suspendre votre propre compte.")
              : t("Vous ne pouvez agir que sur un compte de rôle inférieur au vôtre.")}
          </Alert>
        </div>
      ) : null}
      {delerror ? (
        <div className="mb-4">
          <Alert kind="error">
            {delerror === "self"
              ? t("Vous ne pouvez pas supprimer votre propre compte.")
              : t("Vous ne pouvez supprimer qu'un compte de rôle inférieur au vôtre.")}
          </Alert>
        </div>
      ) : null}

      {others.length === 0 ? (
        <EmptyState>{t("Aucun compte pour le moment.")}</EmptyState>
      ) : (
        <div className="space-y-2">
          {others.map((u) => (
            <Card key={u.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-gray-900">
                    {u.firstName} {u.lastName}
                  </div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {u.status === "APPROVED" ? (
                      <Badge className="border-green-200 bg-green-50 text-green-700">
                        {t("Approuvé")}
                      </Badge>
                    ) : u.status === "SUSPENDED" ? (
                      <Badge className="border-amber-200 bg-amber-50 text-amber-800">
                        {t("En veille")}
                      </Badge>
                    ) : (
                      <Badge className="border-red-200 bg-red-50 text-red-700">
                        {t("Refusé")}
                      </Badge>
                    )}
                    <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                      {t(roleLabels[u.role])}
                    </Badge>
                    <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                      {u.unit
                        ? `${t(u.unit.building.name)} · ${u.unit.label}`
                        : t("Sans logement")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:flex-wrap sm:items-end">
                {manager && u.status === "APPROVED" ? (
                  <form
                    action={resetUserPassword}
                    className="flex flex-1 items-end gap-2"
                  >
                    <input type="hidden" name="userId" value={u.id} />
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

                {canManageRoles && u.id !== admin.id ? (
                  <form action={setUserRole} className="flex items-end gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        {t("Rôle")}
                      </label>
                      <Select
                        name="role"
                        aria-label={t("Rôle")}
                        defaultValue={u.role}
                      >
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

                {manager &&
                rank(admin.role) > rank(u.role) &&
                u.status === "APPROVED" ? (
                  <form action={suspendUser}>
                    <input type="hidden" name="userId" value={u.id} />
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

                {manager &&
                rank(admin.role) > rank(u.role) &&
                u.status === "SUSPENDED" ? (
                  <form action={reactivateUser}>
                    <input type="hidden" name="userId" value={u.id} />
                    <Button type="submit" variant="secondary">
                      {t("Réactiver le compte")}
                    </Button>
                  </form>
                ) : null}

                {rank(admin.role) > rank(u.role) ? (
                  <form action={deleteUser}>
                    <input type="hidden" name="userId" value={u.id} />
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
          ))}
        </div>
      )}
    </div>
  );
}
