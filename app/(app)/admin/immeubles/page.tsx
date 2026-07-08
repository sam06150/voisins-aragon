import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { getResidenceName } from "@/lib/settings";
import { Alert, Button, Card, Field, Input, Select } from "@/components/ui";
import {
  createBuilding,
  createUnit,
  setResidenceName,
  updateBuildingLocation,
} from "../actions";

export default async function AdminImmeublesPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    error?: string;
    bok?: string;
    berror?: string;
    bwarn?: string;
    rok?: string;
  }>;
}) {
  await requireManager();
  const { t } = await getI18n();
  const { ok, error, bok, berror, bwarn, rok } = await searchParams;

  const [buildings, residenceName] = await Promise.all([
    prisma.building.findMany({
      orderBy: { code: "asc" },
      include: {
        units: { orderBy: [{ floor: "asc" }, { label: "asc" }] },
        _count: { select: { units: true } },
      },
    }),
    getResidenceName(),
  ]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-900">
          {t("Bâtiments & logements")}
        </h2>
        <Link
          href="/carte"
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
        >
          🗺️ {t("Voir la carte")}
        </Link>
      </div>

      {ok ? (
        <Alert kind="success">{t("Logement ajouté.")}</Alert>
      ) : null}
      {bok ? (
        <Alert kind="success">{t("Bâtiment enregistré.")}</Alert>
      ) : null}
      {rok ? (
        <Alert kind="success">{t("Nom de la résidence enregistré.")}</Alert>
      ) : null}
      {bwarn === "geo" ? (
        <Alert kind="warning">
          {t("Bâtiment enregistré, mais l'adresse n'a pas pu être située sur la carte. Vérifiez l'orthographe (ex : « 12 rue Louis Aragon, 93000 Bobigny »).")}
        </Alert>
      ) : null}
      {berror ? (
        <Alert kind="error">
          {berror === "exists"
            ? t("Un bâtiment avec ce nom ou ce code existe déjà.")
            : t("Renseignez au moins un nom et un code de bâtiment.")}
        </Alert>
      ) : null}
      {error ? (
        <Alert kind="error">{t("Renseignez un bâtiment et un libellé.")}</Alert>
      ) : null}

      {/* Nom de la résidence */}
      <Card className="mb-6 mt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">
          {t("Nom de la résidence")}
        </h3>
        <form
          action={setResidenceName}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Field label={t("Nom affiché dans l'application")} htmlFor="residenceName">
              <Input
                id="residenceName"
                name="residenceName"
                defaultValue={residenceName}
                placeholder={t("Ex : Résidence des Tilleuls")}
              />
            </Field>
          </div>
          <Button type="submit">{t("Enregistrer")}</Button>
        </form>
      </Card>

      {/* Ajouter un bâtiment */}
      <Card className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">
          {t("Ajouter un bâtiment")}
        </h3>
        <form action={createBuilding} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label={t("Nom")} htmlFor="name">
              <Input id="name" name="name" placeholder={t("Ex : Bâtiment E")} required />
            </Field>
            <Field label={t("Code")} htmlFor="code">
              <Input id="code" name="code" placeholder={t("Ex : E")} required />
            </Field>
            <Field label={t("Adresse (pour la carte)")} htmlFor="address">
              <Input
                id="address"
                name="address"
                placeholder={t("Ex : 12 rue Louis Aragon, 93000 Bobigny")}
              />
            </Field>
          </div>
          <Button type="submit">{t("Créer le bâtiment")}</Button>
        </form>
      </Card>

      {/* Ajouter un logement */}
      <Card className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">
          {t("Ajouter un logement")}
        </h3>
        <form
          action={createUnit}
          className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end"
        >
          <Field label={t("Bâtiment")} htmlFor="buildingId">
            <Select id="buildingId" name="buildingId" required defaultValue="">
              <option value="">{t("— Choisir —")}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {t(b.name)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("Étage")} htmlFor="floor">
            <Input id="floor" name="floor" type="number" placeholder={t("Ex : 2")} />
          </Field>
          <Field label={t("Libellé")} htmlFor="label">
            <Input id="label" name="label" placeholder={t("Ex : 2A")} required />
          </Field>
          <Button type="submit">{t("Ajouter")}</Button>
        </form>
      </Card>

      {/* Liste des bâtiments avec adresse éditable */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {buildings.map((b) => (
          <Card key={b.id}>
            <h3 className="font-bold text-gray-900">
              {t(b.name)}
              <span className="ml-2 text-sm font-normal text-gray-400">
                {b._count.units} {t("logement(s)")}
              </span>
              {b.latitude && b.longitude ? (
                <span className="ml-2 text-xs font-medium text-green-600">
                  📍 {t("situé")}
                </span>
              ) : null}
            </h3>

            <form
              action={updateBuildingLocation}
              className="mt-3 flex items-end gap-2"
            >
              <input type="hidden" name="buildingId" value={b.id} />
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">
                  {t("Adresse")}
                </label>
                <Input
                  name="address"
                  defaultValue={b.address ?? ""}
                  placeholder={t("Ex : 12 rue Louis Aragon, 93000 Bobigny")}
                />
              </div>
              <Button type="submit" variant="secondary">
                {t("Enregistrer")}
              </Button>
            </form>

            {b.units.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">
                {t("Aucun logement enregistré.")}
              </p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {b.units.map((u) => (
                  <li
                    key={u.id}
                    className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600"
                  >
                    {u.label} · {t("ét.")} {u.floor}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
