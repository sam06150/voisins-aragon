import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { rank } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { Alert, Button, Card, Field, Input, Select } from "@/components/ui";
import { DELETED_EMAIL_PREFIX } from "@/lib/accounts";
import { updateUser } from "../../../actions";

const STATUS_OPTIONS = [
  { value: "APPROVED", label: "Approuvé" },
  { value: "PENDING", label: "En attente" },
  { value: "SUSPENDED", label: "En veille" },
  { value: "REJECTED", label: "Refusé" },
] as const;

export default async function ModifierVoisinPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editerror?: string }>;
}) {
  const admin = await requireAdmin();
  const { t } = await getI18n();
  const { id } = await params;
  const { editerror } = await searchParams;

  const [user, buildings, units] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { unit: { include: { building: true } } },
    }),
    prisma.building.findMany({ orderBy: { code: "asc" } }),
    prisma.unit.findMany({
      orderBy: [{ floor: "asc" }, { label: "asc" }],
      include: { building: true },
    }),
  ]);

  if (!user || user.email.startsWith(DELETED_EMAIL_PREFIX)) notFound();
  // Un administrateur ne modifie que les comptes de rôle strictement inférieur.
  if (rank(admin.role) <= rank(user.role)) redirect(`/admin/comptes/${id}`);

  const unitsByBuilding = buildings.map((b) => ({
    building: b,
    units: units.filter((u) => u.buildingId === b.id),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/admin/comptes/${id}`}
          className="text-sm text-gray-500 hover:underline"
        >
          ← {t("Retour à la fiche")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {t("Modifier la fiche")} — {user.firstName} {user.lastName}
        </h1>
      </div>

      {editerror ? (
        <Alert kind="error">
          {editerror === "email"
            ? t("Cette adresse e-mail est déjà utilisée par un autre compte.")
            : editerror === "rank"
              ? t("Vous ne pouvez agir que sur un compte de rôle inférieur au vôtre.")
              : editerror === "unit"
                ? t("Logement introuvable.")
                : t("Vérifiez les champs du formulaire.")}
        </Alert>
      ) : null}

      <form action={updateUser}>
        <input type="hidden" name="userId" value={user.id} />

        <Card className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
            {t("Identité et contact")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("Prénom")}>
              <Input
                name="firstName"
                defaultValue={user.firstName}
                maxLength={60}
                required
              />
            </Field>
            <Field label={t("Nom")}>
              <Input
                name="lastName"
                defaultValue={user.lastName}
                maxLength={60}
                required
              />
            </Field>
          </div>
          <Field
            label={t("E-mail")}
            hint={t("Sert d'identifiant de connexion — doit rester unique.")}
          >
            <Input
              name="email"
              type="email"
              defaultValue={user.email}
              required
            />
          </Field>
          <Field label={t("Téléphone")}>
            <Input
              name="phone"
              type="tel"
              defaultValue={user.phone ?? ""}
              maxLength={30}
              placeholder={t("Facultatif")}
            />
          </Field>
        </Card>

        <Card className="mt-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
            {t("Statut du compte")}
          </h2>
          <Field
            label={t("Statut")}
            hint={t(
              "« En veille » suspend l'accès sans supprimer les données (réversible).",
            )}
          >
            <Select name="status" defaultValue={user.status}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.label)}
                </option>
              ))}
            </Select>
          </Field>
        </Card>

        <Card className="mt-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
            {t("Logement")}
          </h2>
          <Field label={t("Logement rattaché")}>
            <Select name="unitId" defaultValue={user.unitId ?? ""}>
              <option value="">{t("— Sans logement —")}</option>
              {unitsByBuilding.map(({ building, units: list }) =>
                list.length ? (
                  <optgroup key={building.id} label={t(building.name)}>
                    {list.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label} ({t("étage")} {u.floor})
                      </option>
                    ))}
                  </optgroup>
                ) : null,
              )}
            </Select>
          </Field>

          <p className="text-xs text-gray-500">
            {t(
              "…ou créez le logement s'il n'existe pas encore (laissez « Sans logement » ci-dessus) :",
            )}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t("Bâtiment")}>
              <Select
                name="newBuildingId"
                defaultValue={user.unit?.buildingId ?? ""}
              >
                <option value="">{t("— Choisir —")}</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {t(b.name)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("Étage")}>
              <Input name="newFloor" type="number" placeholder={t("Ex : 3")} />
            </Field>
            <Field label={t("Libellé")}>
              <Input
                name="newUnitLabel"
                maxLength={60}
                placeholder={t("Ex : 3B")}
              />
            </Field>
          </div>
        </Card>

        <p className="mt-4 text-xs text-gray-500">
          {t(
            "Les préférences d'annuaire (visibilité, partage e-mail / téléphone) ne sont pas modifiables ici : seul l'intéressé peut donner ou retirer ce consentement, depuis « Mon compte ».",
          )}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit">{t("Enregistrer les modifications")}</Button>
          <Link
            href={`/admin/comptes/${id}`}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-600 hover:underline"
          >
            {t("Annuler")}
          </Link>
        </div>
      </form>
    </div>
  );
}
