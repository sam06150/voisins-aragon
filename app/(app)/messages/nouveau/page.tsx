import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { scopeFor, userScopeWhere } from "@/lib/tenancy";
import { Card, PageHeader } from "@/components/ui";
import NewMessageForm from "./NewMessageForm";

export default async function NouveauMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string }>;
}) {
  const user = await requireApproved();
  const scope = scopeFor(user);
  const { t } = await getI18n();
  const { a } = await searchParams;

  const users = await prisma.user.findMany({
    where: {
      ...userScopeWhere(scope), // on ne contacte que sa résidence
      status: "APPROVED",
      id: { not: user.id },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });

  const recipients = users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("Nouveau message")} />
      <Card>
        <NewMessageForm recipients={recipients} defaultRecipientId={a} />
      </Card>
    </div>
  );
}
