import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isManager } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import { formatDate } from "@/lib/labels";
import { deleteAnnouncement } from "./actions";

export default async function AnnoncesPage() {
  const user = await requireApproved();
  const { t } = await getI18n();
  const isAdmin = isManager(user.role);
  const buildingId = user.unit?.buildingId ?? null;

  const buildingFilter = buildingId
    ? [{ buildingId: null }, { buildingId }]
    : [{ buildingId: null }];

  // Les admins voient toutes les annonces pour pouvoir les gérer.
  const announcements = await prisma.announcement.findMany({
    where: isAdmin ? {} : { OR: buildingFilter },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: {
      building: true,
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title={t("Annonces")}
        description={t("Les communications officielles du collectif.")}
        action={
          isAdmin ? (
            <LinkButton href="/annonces/nouveau">
              + {t("Nouvelle annonce")}
            </LinkButton>
          ) : undefined
        }
      />

      {announcements.length === 0 ? (
        <EmptyState>{t("Aucune annonce pour le moment.")}</EmptyState>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {a.pinned ? (
                  <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                    📌 {t("Épinglée")}
                  </Badge>
                ) : null}
                <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                  {a.building ? t(a.building.name) : t("Toutes résidences")}
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{a.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-gray-700">{a.body}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {a.author.firstName} {a.author.lastName} · {formatDate(a.createdAt)}
                </p>
                {isAdmin ? (
                  <form action={deleteAnnouncement}>
                    <input type="hidden" name="announcementId" value={a.id} />
                    <ConfirmButton
                      variant="ghost"
                      confirmMessage={t("Supprimer cette annonce ?")}
                    >
                      {t("Supprimer")}
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
