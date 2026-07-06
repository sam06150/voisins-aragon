import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isStaff } from "@/lib/roles";
import { prisma } from "@/lib/db";
import type { HelpType } from "@prisma/client";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import { formatDate, helpTypeLabels } from "@/lib/labels";
import HelpForm from "./HelpForm";
import { deleteHelpOffer, toggleResolved } from "./actions";

export default async function EntraidePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireApproved();
  const { t } = await getI18n();
  const { type } = await searchParams;
  const typeFilter =
    type === "OFFRE" || type === "DEMANDE" ? (type as HelpType) : null;

  const [offers, buildings] = await Promise.all([
    prisma.helpOffer.findMany({
      where: typeFilter ? { type: typeFilter } : {},
      include: { building: true, author: true },
      orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
    }),
    prisma.building.findMany({
      orderBy: { code: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("Entraide entre voisins")}
        description={t(
          "Prêt de matériel, coups de main, covoiturage… la solidarité du collectif.",
        )}
      />

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">
          {t("Publier une offre ou une demande")}
        </h2>
        <HelpForm buildings={buildings} />
      </Card>

      <div className="mb-4 flex flex-wrap gap-2">
        <Chip href="/entraide" label={t("Tout")} active={!typeFilter} />
        <Chip href="/entraide?type=OFFRE" label={t("Propositions")} active={typeFilter === "OFFRE"} />
        <Chip href="/entraide?type=DEMANDE" label={t("Demandes")} active={typeFilter === "DEMANDE"} />
      </div>

      {offers.length === 0 ? (
        <EmptyState>
          {t("Rien ici pour le moment. Soyez le premier à publier !")}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {offers.map((o) => (
            <Card key={o.id} className={o.resolved ? "opacity-60" : ""}>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    o.type === "OFFRE"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                  }
                >
                  {t(helpTypeLabels[o.type])}
                </Badge>
                <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                  {o.building ? t(o.building.name) : t("Toutes résidences")}
                </Badge>
                {o.resolved ? (
                  <Badge className="border-gray-200 bg-gray-100 text-gray-600">
                    {t("Clôturé")}
                  </Badge>
                ) : null}
              </div>
              <h3 className="font-semibold text-gray-900">{o.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                {o.description}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {o.author.firstName} {o.author.lastName} · {formatDate(o.createdAt)}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/messages/nouveau?a=${o.authorId}`}
                    className="text-xs font-semibold text-rose-700 hover:underline"
                  >
                    {t("Contacter")}
                  </Link>
                  {o.authorId === user.id || isStaff(user.role) ? (
                    <>
                      <form action={toggleResolved}>
                        <input type="hidden" name="offerId" value={o.id} />
                        <button
                          type="submit"
                          className="text-xs text-gray-500 hover:underline"
                        >
                          {o.resolved ? t("Rouvrir") : t("Clôturer")}
                        </button>
                      </form>
                      <form action={deleteHelpOffer}>
                        <input type="hidden" name="offerId" value={o.id} />
                        <ConfirmButton
                          variant="ghost"
                          className="px-1.5 py-0.5 text-xs"
                          confirmMessage={t("Supprimer cette publication ?")}
                        >
                          {t("Suppr.")}
                        </ConfirmButton>
                      </form>
                    </>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
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
