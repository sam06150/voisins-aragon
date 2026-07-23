import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isManager } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { scopeFor, optionalBuildingScopeWhere } from "@/lib/tenancy";
import { Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/labels";

export default async function ReunionsPage() {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();
  const isAdmin = isManager(user.role);
  const now = new Date();
  const scopeWhere = optionalBuildingScopeWhere(scope); // cloisonnement résidence

  const [upcoming, past] = await Promise.all([
    prisma.meeting.findMany({
      where: { AND: [scopeWhere, { scheduledAt: { gte: now } }] },
      orderBy: { scheduledAt: "asc" },
      include: { building: true, _count: { select: { documents: true } } },
    }),
    prisma.meeting.findMany({
      where: { AND: [scopeWhere, { scheduledAt: { lt: now } }] },
      orderBy: { scheduledAt: "desc" },
      include: { building: true, _count: { select: { documents: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("Réunions")}
        description={t(
          "Prochaines réunions du collectif et comptes-rendus des précédentes.",
        )}
        action={
          isAdmin ? (
            <LinkButton href="/reunions/nouveau">
              + {t("Nouvelle réunion")}
            </LinkButton>
          ) : undefined
        }
      />

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-gray-900">{t("À venir")}</h2>
        {upcoming.length === 0 ? (
          <EmptyState>{t("Aucune réunion programmée.")}</EmptyState>
        ) : (
          <div className="space-y-2">
            {upcoming.map((m) => (
              <MeetingRow key={m.id} meeting={m} t={t} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">{t("Passées")}</h2>
        {past.length === 0 ? (
          <EmptyState>{t("Aucune réunion passée.")}</EmptyState>
        ) : (
          <div className="space-y-2">
            {past.map((m) => (
              <MeetingRow key={m.id} meeting={m} t={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MeetingRow({
  meeting,
  t,
}: {
  meeting: {
    id: string;
    title: string;
    scheduledAt: Date;
    location: string | null;
    minutesText: string | null;
    building: { name: string } | null;
    _count: { documents: number };
  };
  t: (fr: string) => string;
}) {
  return (
    <Link href={`/reunions/${meeting.id}`} className="block">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:shadow">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge className="border-gray-200 bg-gray-50 text-gray-600">
            {meeting.building ? t(meeting.building.name) : t("Toutes résidences")}
          </Badge>
          {meeting.minutesText || meeting._count.documents > 0 ? (
            <Badge className="border-green-200 bg-green-50 text-green-700">
              {t("Compte-rendu disponible")}
            </Badge>
          ) : null}
        </div>
        <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
        <p className="mt-1 text-sm text-gray-600">
          🗓️ {formatDateTime(meeting.scheduledAt)}
          {meeting.location ? ` · 📍 ${meeting.location}` : ""}
        </p>
      </div>
    </Link>
  );
}
