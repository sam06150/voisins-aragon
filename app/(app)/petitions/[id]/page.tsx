import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { isStaff } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { scopeFor, optionalBuildingScopeWhere } from "@/lib/tenancy";
import { Badge, Button, Card, Textarea } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import { formatDate } from "@/lib/labels";
import {
  closePetition,
  deletePetition,
  signPetition,
  unsignPetition,
} from "../actions";

export default async function PetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();
  const { id } = await params;

  const petition = await prisma.petition.findFirst({
    // 404 si la pétition est hors de la résidence de l'utilisateur.
    where: { AND: [optionalBuildingScopeWhere(scope), { id }] },
    include: {
      building: true,
      author: { select: { id: true, firstName: true, lastName: true } },
      signatures: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!petition) notFound();

  const hasSigned = petition.signatures.some((s) => s.userId === user.id);
  const count = petition.signatures.length;
  const pct = petition.goal
    ? Math.min(100, Math.round((count / petition.goal) * 100))
    : null;
  const canManage = petition.authorId === user.id || isStaff(user.role);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/petitions"
        className="mb-4 inline-block text-sm text-gray-500 hover:underline"
      >
        ← {t("Retour aux pétitions")}
      </Link>

      <Card>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {petition.closed ? (
            <Badge className="border-gray-200 bg-gray-100 text-gray-600">
              {t("Clôturée")}
            </Badge>
          ) : (
            <Badge className="border-rose-200 bg-rose-50 text-rose-700">
              {t("En cours")}
            </Badge>
          )}
          <Badge className="border-gray-200 bg-gray-50 text-gray-600">
            {petition.building ? t(petition.building.name) : t("Toutes résidences")}
          </Badge>
        </div>

        <h1 className="text-xl font-bold text-gray-900">{petition.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-gray-700">
          {petition.description}
        </p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-lg font-bold text-gray-900">
              {count} {t("signature(s)")}
            </span>
            {petition.goal ? (
              <span className="text-gray-500">
                {t("objectif :")} {petition.goal}
              </span>
            ) : null}
          </div>
          {pct !== null ? (
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-rose-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          ) : null}
        </div>

        {!petition.closed ? (
          hasSigned ? (
            <div className="mt-5 flex items-center gap-3">
              <Badge className="border-green-200 bg-green-50 text-green-700">
                ✓ {t("Vous avez signé")}
              </Badge>
              <form action={unsignPetition}>
                <input type="hidden" name="petitionId" value={petition.id} />
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:underline"
                >
                  {t("Retirer ma signature")}
                </button>
              </form>
            </div>
          ) : (
            <form action={signPetition} className="mt-5 space-y-3">
              <input type="hidden" name="petitionId" value={petition.id} />
              <Textarea
                name="comment"
                placeholder={t(
                  "Ajouter un commentaire à votre signature (facultatif)…",
                )}
                className="min-h-16"
              />
              <Button type="submit">✍️ {t("Signer la pétition")}</Button>
            </form>
          )
        ) : (
          <p className="mt-5 text-sm text-gray-500">
            {t("Cette pétition est clôturée, il n'est plus possible de signer.")}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500">
            {t("Lancée par")} {petition.author.firstName}{" "}
            {petition.author.lastName} · {formatDate(petition.createdAt)}
          </p>
          {canManage ? (
            <div className="flex items-center gap-2">
              <form action={closePetition}>
                <input type="hidden" name="petitionId" value={petition.id} />
                <ConfirmButton
                  variant="neutral"
                  confirmMessage={
                    petition.closed
                      ? t("Rouvrir cette pétition ?")
                      : t("Clôturer cette pétition ?")
                  }
                >
                  {petition.closed ? t("Rouvrir") : t("Clôturer")}
                </ConfirmButton>
              </form>
              <form action={deletePetition}>
                <input type="hidden" name="petitionId" value={petition.id} />
                <ConfirmButton
                  variant="ghost"
                  confirmMessage={t(
                    "Supprimer définitivement cette pétition et ses signatures ?",
                  )}
                >
                  🗑️ {t("Supprimer")}
                </ConfirmButton>
              </form>
            </div>
          ) : null}
        </div>
      </Card>

      <h2 className="mb-3 mt-6 text-lg font-bold text-gray-900">
        {t("Signataires")}
      </h2>
      <div className="space-y-2">
        {petition.signatures.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {s.user.firstName} {s.user.lastName}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(s.createdAt)}
              </span>
            </div>
            {s.comment ? (
              <p className="mt-1 text-sm text-gray-600">« {s.comment} »</p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
