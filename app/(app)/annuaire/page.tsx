import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function AnnuairePage({
  searchParams,
}: {
  searchParams: Promise<{ batiment?: string }>;
}) {
  await requireApproved();
  const { t } = await getI18n();
  const { batiment } = await searchParams;

  const buildings = await prisma.building.findMany({
    orderBy: { code: "asc" },
  });

  const selected = batiment && batiment !== "tous" ? batiment : null;

  const residents = await prisma.user.findMany({
    where: {
      status: "APPROVED",
      shareInDirectory: true,
      ...(selected ? { unit: { buildingId: selected } } : {}),
    },
    include: { unit: { include: { building: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  // Regroupement par bâtiment puis par étage.
  const groups = new Map<
    string,
    { buildingName: string; code: string; residents: typeof residents }
  >();
  for (const r of residents) {
    const key = r.unit?.building.id ?? "sans";
    const buildingName = r.unit?.building.name ?? "Bâtiment non renseigné";
    const code = r.unit?.building.code ?? "?";
    if (!groups.has(key)) groups.set(key, { buildingName, code, residents: [] });
    groups.get(key)!.residents.push(r);
  }
  const sortedGroups = [...groups.values()].sort((a, b) =>
    a.code.localeCompare(b.code),
  );

  return (
    <div>
      <PageHeader
        title={t("Annuaire des voisins")}
        description={t(
          "Retrouvez les locataires qui ont accepté de partager leurs coordonnées. Vous choisissez ce que vous partagez.",
        )}
        action={
          <LinkButton href="/annuaire/moi" variant="secondary">
            {t("Mes préférences de partage")}
          </LinkButton>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip
          href="/annuaire"
          label={t("Tous les bâtiments")}
          active={!selected}
        />
        {buildings.map((b) => (
          <FilterChip
            key={b.id}
            href={`/annuaire?batiment=${b.id}`}
            label={t(b.name)}
            active={selected === b.id}
          />
        ))}
      </div>

      {residents.length === 0 ? (
        <EmptyState>
          {t("Personne n'a encore partagé ses coordonnées ici.")}
          <br />
          {t("Soyez le premier via")}{" "}
          <Link
            href="/annuaire/moi"
            className="font-semibold text-rose-700 hover:underline"
          >
            {t("« Mes préférences de partage »")}
          </Link>
          .
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map((g) => (
            <section key={g.buildingName}>
              <h2 className="mb-3 text-lg font-bold text-gray-900">
                {t(g.buildingName)}
                <span className="ml-2 text-sm font-normal text-gray-400">
                  {g.residents.length} {t("voisin(s)")}
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.residents.map((r) => (
                  <Card key={r.id}>
                    <div className="font-semibold text-gray-900">
                      {r.firstName} {r.lastName}
                    </div>
                    {r.unit ? (
                      <Badge className="mt-1 border-gray-200 bg-gray-50 text-gray-600">
                        {r.unit.label} · {t("étage")} {r.unit.floor}
                      </Badge>
                    ) : null}
                    <div className="mt-3 space-y-1 text-sm">
                      {r.shareEmail ? (
                        <a
                          href={`mailto:${r.email}`}
                          className="block truncate text-rose-700 hover:underline"
                        >
                          ✉️ {r.email}
                        </a>
                      ) : null}
                      {r.sharePhone && r.phone ? (
                        <a
                          href={`tel:${r.phone}`}
                          className="block text-gray-700 hover:underline"
                        >
                          📞 {r.phone}
                        </a>
                      ) : null}
                      {!r.shareEmail && !(r.sharePhone && r.phone) ? (
                        <span className="text-xs text-gray-400">
                          {t("Coordonnées non partagées")}
                        </span>
                      ) : null}
                    </div>
                    <Link
                      href={`/messages/nouveau?a=${r.id}`}
                      className="mt-3 inline-block text-xs font-semibold text-rose-700 hover:underline"
                    >
                      ✉️ {t("Envoyer un message")}
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "border-rose-300 bg-rose-600 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}
