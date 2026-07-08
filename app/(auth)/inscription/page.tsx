import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import SignupForm from "./SignupForm";

export default async function InscriptionPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.status === "APPROVED" ? "/accueil" : "/en-attente");
  }
  const { t } = await getI18n();

  const buildings = await prisma.building.findMany({
    orderBy: { code: "asc" },
    select: { id: true, name: true },
  });

  return (
    <Card>
      <h1 className="mb-1 text-lg font-bold text-gray-900">{t("Inscription")}</h1>
      <p className="mb-5 text-sm text-gray-600">
        {t(
          "Réservée aux locataires de la résidence. Votre compte sera vérifié par un référent du collectif avant activation.",
        )}
      </p>
      <SignupForm buildings={buildings} />
      <p className="mt-5 text-center text-sm text-gray-600">
        {t("Déjà un compte ?")}{" "}
        <Link
          href="/connexion"
          className="font-semibold text-rose-700 hover:underline"
        >
          {t("Se connecter")}
        </Link>
      </p>
    </Card>
  );
}
