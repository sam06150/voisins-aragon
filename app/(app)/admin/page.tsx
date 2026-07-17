import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { formatDateTime, incidentStatusLabels } from "@/lib/labels";

export default async function AdminDashboardPage() {
  await requireStaff();
  const { t } = await getI18n();

  const [
    pendingCount,
    residentCount,
    openIncidents,
    petitionCount,
    pollCount,
    recentSignups,
    recentIncidents,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { status: "APPROVED" } }),
    prisma.incidentReport.count({
      where: { status: { in: ["OUVERT", "EN_COURS"] } },
    }),
    prisma.petition.count(),
    prisma.poll.count(),
    prisma.user.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.incidentReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { building: true },
    }),
  ]);

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-gray-900">
        {t("Tableau de bord")}
      </h2>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Link href="/admin/comptes" className="block">
          <div
            className={`rounded-xl border p-4 shadow-sm transition hover:shadow ${
              pendingCount > 0
                ? "border-amber-300 bg-amber-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
            <div className="mt-1 text-xs font-medium text-gray-500">
              {t("En attente")}
            </div>
          </div>
        </Link>
        <Stat label={t("Locataires")} value={residentCount} />
        <Stat label={t("Signalements actifs")} value={openIncidents} />
        <Stat label={t("Pétitions")} value={petitionCount} />
        <Stat label={t("Sondages")} value={pollCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">{t("Inscriptions à valider")}</h3>
            <Link
              href="/admin/comptes"
              className="text-sm font-medium text-rose-700 hover:underline"
            >
              {t("Gérer")}
            </Link>
          </div>
          {recentSignups.length === 0 ? (
            <Card>
              <p className="text-sm text-gray-500">
                {t("Aucune inscription en attente.")}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentSignups.map((u) => (
                <Card key={u.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                    <Badge className="border-amber-200 bg-amber-50 text-amber-800">
                      {t("En attente")}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-3 font-bold text-gray-900">
            {t("Derniers signalements")}
          </h3>
          {recentIncidents.length === 0 ? (
            <Card>
              <p className="text-sm text-gray-500">{t("Aucun signalement.")}</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentIncidents.map((i) => (
                <Link key={i.id} href={`/incidents/${i.id}`} className="block">
                  <Card className="transition hover:border-rose-200">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-gray-900">
                        {i.title}
                      </span>
                      <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                        {t(incidentStatusLabels[i.status])}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {i.building.name} · {formatDateTime(i.createdAt)}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-xs font-medium text-gray-500">{label}</div>
    </div>
  );
}
