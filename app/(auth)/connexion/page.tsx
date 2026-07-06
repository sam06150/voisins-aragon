import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { Card } from "@/components/ui";
import LoginForm from "./LoginForm";

export default async function ConnexionPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.status === "APPROVED" ? "/accueil" : "/en-attente");
  }
  const { t } = await getI18n();

  return (
    <Card>
      <h1 className="mb-1 text-lg font-bold text-gray-900">{t("Connexion")}</h1>
      <p className="mb-5 text-sm text-gray-600">
        {t("Accédez à l'espace des locataires de la résidence.")}
      </p>
      <LoginForm />
      <p className="mt-5 text-center text-sm text-gray-600">
        {t("Pas encore de compte ?")}{" "}
        <Link
          href="/inscription"
          className="font-semibold text-rose-700 hover:underline"
        >
          {t("S'inscrire")}
        </Link>
      </p>
    </Card>
  );
}
