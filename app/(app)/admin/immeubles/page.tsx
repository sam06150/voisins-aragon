import { requireManager } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Alert, Button, Card, Field, Input, Select } from "@/components/ui";
import { createUnit } from "../actions";

export default async function AdminImmeublesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireManager();
  const { t } = await getI18n();
  const { ok, error } = await searchParams;

  const buildings = await prisma.building.findMany({
    orderBy: { code: "asc" },
    include: {
      units: { orderBy: [{ floor: "asc" }, { label: "asc" }] },
      _count: { select: { units: true } },
    },
  });

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-gray-900">
        {t("Bâtiments & logements")}
      </h2>
      <p className="mb-5 text-sm text-gray-600">
        {t(
          "Ajoutez les logements de la résidence pour pouvoir y rattacher les locataires.",
        )}
      </p>

      {ok ? (
        <div className="mb-4">
          <Alert kind="success">{t("Logement ajouté.")}</Alert>
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <Alert kind="error">{t("Renseignez un bâtiment et un libellé.")}</Alert>
        </div>
      ) : null}

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {buildings.map((b) => (
          <Card key={b.id}>
            <h3 className="font-bold text-gray-900">
              {t(b.name)}
              <span className="ml-2 text-sm font-normal text-gray-400">
                {b._count.units} {t("logement(s)")}
              </span>
            </h3>
            {b.units.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">
                {t("Aucun logement enregistré.")}
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5">
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
