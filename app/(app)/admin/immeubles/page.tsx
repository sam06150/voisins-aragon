import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { getResidenceName } from "@/lib/settings";
import { Alert, Button, Card, Field, Input, Select } from "@/components/ui";
import {
  assignBuildingResidence,
  createBuilding,
  createResidence,
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
    resok?: string;
    rerror?: string;
  }>;
}) {
  await requireManager();
  const { t } = await getI18n();
  const { ok, error, bok, berror, bwarn, rok, resok, rerror } =
    await searchParams;

  const [residences, buildings, residenceName] = await Promise.all([
    prisma.residence.findMany({ orderBy: { name: "asc" } }),
    prisma.building.findMany({
      orderBy: { code: "asc" },
      include: {
        units: { orderBy: [{ floor: "asc" }, { label: "asc" }] },
        _count: { select: { units: true } },
      },
    }),
    getResidenceName(),
  ]);

  // Regroupement des bâtiments par résidence (+ groupe "sans résidence").
  const groups = [
    ...residences.map((r) => ({
      key: r.id,
      title: r.name,
      buildings: buildings.filter((b) => b.residenceId === r.id),
    })),
    {
      key: "none",
      title: t("Sans résidence"),
      buildings: buildings.filter((b) => !b.residenceId),
    },
  ].filter((g) => g.buildings.length > 0 || g.key !== "none");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-900">
          {t("Résidences, bâtiments & logements")}
        </h2>
        <Link
          href="/carte"
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
        >
          🗺️ {t("Voir la carte")}
        </Link>
      </div>

      {ok ? <Alert kind="success">{t("Logement ajouté.")}</Alert> : null}
      {bok ? <Alert kind="success">{t("Bâtiment enregistré.")}</Alert> : null}
      {resok ? <Alert kind="success">{t("Résidence enregistrée.")}</Alert> : null}
      {rok ? (
        <Alert kind="success">{t("Nom de la résidence enregistré.")}</Alert>
      ) : null}
      {bwarn === "geo" ? (
        <Alert kind="warning">
          {t("Enregistré, mais l'adresse n'a pas pu être située. Vérifiez l'orthographe (ex : « 12 rue Louis Aragon, 93000 Bobigny »).")}
        </Alert>
      ) : null}
      {berror ? (
        <Alert kind="error">
          {berror === "exists"
            ? t("Un bâtiment avec ce nom ou ce code existe déjà.")
            : t("Renseignez au moins un nom et un code de bâtiment.")}
        </Alert>
      ) : null}
      {rerror ? (
        <Alert kind="error">
          {rerror === "exists"
            ? t("Une résidence avec ce nom existe déjà.")
            : t("Renseignez le nom de la résidence.")}
        </Alert>
      ) : null}
      {error ? (
        <Alert kind="error">{t("Renseignez un bâtiment et un libellé.")}</Alert>
      ) : null}

      {/* Nom affiché en en-tête de l'application */}
      <Card className="mb-6 mt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">
          {t("Nom affiché en haut de l'application")}
        </h3>
        <form
          action={setResidenceName}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Field label={t("Nom")} htmlFor="residenceName">
              <Input
                id="residenceName"
                name="residenceName"
                defaultValue={residenceName}
                placeholder={t("Ex : Collectif des Tilleuls")}
              />
            </Field>
          </div>
          <Button type="submit">{t("Enregistrer")}</Button>
        </form>
      </Card>

      {/* Créer une résidence */}
      <Card className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">
          {t("Créer une résidence")}
        </h3>
        <form action={createResidence} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("Nom de la résidence")} htmlFor="resname">
              <Input
                id="resname"
                name="name"
                placeholder={t("Ex : Résidence des Tilleuls")}
                required
              />
            </Field>
            <Field label={t("Adresse (facultatif)")} htmlFor="resaddr">
              <Input
                id="resaddr"
                name="address"
                placeholder={t("Ex : 10 rue des Tilleuls, 93000 Bobigny")}
              />
            </Field>
          </div>
          <Button type="submit">{t("Créer la résidence")}</Button>
        </form>
        {residences.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {residences.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700"
              >
                🏢 {r.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-gray-500">
            {t("Aucune résidence pour l'instant.")}
          </p>
        )}
      </Card>

      {/* Ajouter un bâtiment */}
      <Card className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">
          {t("Ajouter un bâtiment")}
        </h3>
        <form action={createBuilding} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={t("Nom")} htmlFor="name">
              <Input id="name" name="name" placeholder={t("Ex : Bâtiment E")} required />
            </Field>
            <Field label={t("Code")} htmlFor="code">
              <Input id="code" name="code" placeholder={t("Ex : E")} required />
            </Field>
            <Field label={t("Résidence")} htmlFor="bresidence">
              <Select id="bresidence" name="residenceId" defaultValue="">
                <option value="">{t("— Aucune —")}</option>
                {residences.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
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

      {/* Bâtiments regroupés par résidence */}
      {groups.map((g) => (
        <section key={g.key} className="mb-8">
          <h3 className="mb-3 text-lg font-bold text-gray-900">
            🏢 {g.title}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {g.buildings.length} {t("bâtiment(s)")}
            </span>
          </h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {g.buildings.map((b) => (
              <Card key={b.id}>
                <h4 className="font-bold text-gray-900">
                  {t(b.name)}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    {b._count.units} {t("logement(s)")}
                  </span>
                  {b.latitude && b.longitude ? (
                    <span className="ml-2 text-xs font-medium text-green-600">
                      📍 {t("situé")}
                    </span>
                  ) : null}
                </h4>

                {/* Résidence de rattachement */}
                <form
                  action={assignBuildingResidence}
                  className="mt-3 flex items-end gap-2"
                >
                  <input type="hidden" name="buildingId" value={b.id} />
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-gray-500">
                      {t("Résidence")}
                    </label>
                    <Select name="residenceId" defaultValue={b.residenceId ?? ""}>
                      <option value="">{t("— Aucune —")}</option>
                      {residences.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button type="submit" variant="secondary">
                    {t("Ranger")}
                  </Button>
                </form>

                {/* Adresse */}
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

                <Link
                  href={`/admin/immeubles/${b.id}/localiser`}
                  className="mt-2 inline-block text-sm font-medium text-rose-700 hover:underline"
                >
                  🗺️ {t("Situer précisément sur la carte")}
                </Link>

                {b.units.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">
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
        </section>
      ))}
    </div>
  );
}
