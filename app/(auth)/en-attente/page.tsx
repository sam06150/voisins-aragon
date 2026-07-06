import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { Alert, Card } from "@/components/ui";
import LogoutButton from "@/components/LogoutButton";

export default async function EnAttentePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (user.status === "APPROVED") redirect("/accueil");
  const { t } = await getI18n();

  return (
    <Card>
      <h1 className="mb-3 text-lg font-bold text-gray-900">
        {t("Compte en attente de validation")}
      </h1>
      {user.status === "REJECTED" ? (
        <Alert kind="error">
          {t(
            "Votre demande d'inscription a été refusée. Si vous pensez qu'il s'agit d'une erreur, contactez un référent du collectif.",
          )}
        </Alert>
      ) : (
        <Alert kind="warning">
          {t("Bonjour")} {user.firstName},{" "}
          {t(
            "votre inscription a bien été enregistrée. Un référent du collectif doit vérifier que vous êtes locataire de la résidence avant d'activer votre accès. Revenez vous connecter un peu plus tard.",
          )}
        </Alert>
      )}
      <div className="mt-5 text-center">
        <LogoutButton className="text-sm font-semibold text-rose-700 hover:underline" />
      </div>
    </Card>
  );
}
