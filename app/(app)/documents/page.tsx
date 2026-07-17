import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isStaff } from "@/lib/roles";
import { prisma } from "@/lib/db";
import type { DocumentCategory } from "@prisma/client";
import { Alert, Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import { documentCategoryLabels, formatDate } from "@/lib/labels";
import { documentCategories } from "@/lib/validation";
import { publicFileUrl } from "@/lib/storage";
import { deleteDocument } from "./actions";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; error?: string }>;
}) {
  const user = await requireApproved();
  const { t } = await getI18n();
  const isAdmin = isStaff(user.role);
  const { categorie, error } = await searchParams;

  const categoryFilter =
    categorie && categorie !== "tous"
      ? (categorie as DocumentCategory)
      : null;

  const documents = await prisma.document.findMany({
    where: categoryFilter ? { category: categoryFilter } : {},
    include: {
      building: true,
      author: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title={t("Documents partagés")}
        description={t(
          "Modèles de lettres, pétitions, justificatifs, comptes-rendus… Les ressources du collectif.",
        )}
        action={
          <LinkButton href="/documents/nouveau">
            + {t("Ajouter un document")}
          </LinkButton>
        }
      />

      {error === "forbidden" ? (
        <div className="mb-4">
          <Alert kind="error">
            {t("Vous ne pouvez supprimer que vos propres documents.")}
          </Alert>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        <Chip href="/documents" label={t("Tous")} active={!categoryFilter} />
        {documentCategories.map((c) => (
          <Chip
            key={c}
            href={`/documents?categorie=${c}`}
            label={t(documentCategoryLabels[c])}
            active={categoryFilter === c}
          />
        ))}
      </div>

      {documents.length === 0 ? (
        <EmptyState>{t("Aucun document dans cette catégorie.")}</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {documents.map((d) => (
            <Card key={d.id}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                  {t(documentCategoryLabels[d.category])}
                </Badge>
                <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                  {d.building ? t(d.building.name) : t("Toutes résidences")}
                </Badge>
              </div>
              <a
                href={publicFileUrl(d.filePath)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-900 hover:text-rose-700 hover:underline"
              >
                📄 {d.title}
              </a>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {d.author.firstName} {d.author.lastName} · {formatDate(d.createdAt)}
                </p>
                {isAdmin || d.authorId === user.id ? (
                  <form action={deleteDocument}>
                    <input type="hidden" name="documentId" value={d.id} />
                    <ConfirmButton
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      confirmMessage={t("Supprimer ce document ?")}
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
