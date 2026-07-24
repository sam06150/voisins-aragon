import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { scopeFor } from "@/lib/tenancy";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/labels";

/** Libellés lisibles des codes d'action du journal. */
const actionLabels: Record<string, string> = {
  "account.approve": "Compte validé",
  "account.reject": "Compte refusé",
  "account.suspend": "Compte suspendu",
  "account.reactivate": "Compte réactivé",
  "account.delete": "Compte supprimé",
  "account.role": "Rôle modifié",
  "account.password_reset": "Mot de passe réinitialisé",
};

const actionColors: Record<string, string> = {
  "account.approve": "bg-green-100 text-green-800",
  "account.reject": "bg-rose-100 text-rose-800",
  "account.suspend": "bg-amber-100 text-amber-800",
  "account.reactivate": "bg-green-100 text-green-800",
  "account.delete": "bg-rose-100 text-rose-800",
  "account.role": "bg-blue-100 text-blue-800",
  "account.password_reset": "bg-amber-100 text-amber-800",
};

export default async function JournalPage() {
  const admin = await requireManager();
  const scope = scopeFor(admin);
  const { t } = await getI18n();

  const entries = await prisma.auditLog.findMany({
    // Cloisonnement : un référent ne voit que le journal de sa résidence.
    where: scope.kind === "residence" ? { residenceId: scope.residenceId } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <Link
        href="/admin"
        className="mb-4 inline-block text-sm text-gray-500 hover:underline"
      >
        ← {t("Retour à l'administration")}
      </Link>

      <PageHeader
        title={t("Journal d'audit")}
        description={t(
          "Historique des décisions sensibles (validation, refus, suspension, rôle, suppression). Traçabilité interne du collectif.",
        )}
      />

      {entries.length === 0 ? (
        <EmptyState>{t("Aucune action enregistrée pour le moment.")}</EmptyState>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Card key={e.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    actionColors[e.action] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {t(actionLabels[e.action] ?? e.action)}
                </span>
                {e.target ? (
                  <span className="font-medium text-gray-900">{e.target}</span>
                ) : null}
                <span className="ml-auto text-xs text-gray-500">
                  {formatDateTime(e.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {t("Par")} <span className="font-medium">{e.actorName}</span>
                {e.detail ? ` · ${e.detail}` : ""}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
