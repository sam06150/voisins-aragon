import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { Alert, Button, Card, PageHeader } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import { emailConfigured } from "@/lib/email";
import { roleLabels } from "@/lib/labels";
import ChangePasswordForm from "./ChangePasswordForm";
import { updateEmailPref, deleteMyAccount } from "./actions";

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<{ prefok?: string; delerror?: string }>;
}) {
  const user = await requireApproved();
  const { t } = await getI18n();
  const { prefok, delerror } = await searchParams;
  const smtpReady = emailConfigured();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={t("Mon compte")}
        description={t("Vos informations et la sécurité de votre compte.")}
      />

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">
          {t("Informations")}
        </h2>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">{t("Nom")}</dt>
            <dd className="font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">{t("E-mail")}</dt>
            <dd className="font-medium text-gray-900">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">{t("Logement")}</dt>
            <dd className="font-medium text-gray-900">
              {user.unit
                ? `${t(user.unit.building.name)} · ${user.unit.label}`
                : t("Non rattaché")}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">{t("Rôle")}</dt>
            <dd className="font-medium text-gray-900">
              {t(roleLabels[user.role])}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">
          {t("Notifications par e-mail")}
        </h2>
        {prefok ? (
          <div className="mb-3">
            <Alert kind="success">{t("Préférence enregistrée.")}</Alert>
          </div>
        ) : null}
        {!smtpReady ? (
          <div className="mb-3">
            <Alert kind="info">
              {t(
                "L'envoi d'e-mails n'est pas encore activé sur ce serveur (voir le README, section e-mails). Cette préférence sera prise en compte dès qu'il le sera.",
              )}
            </Alert>
          </div>
        ) : null}
        <form action={updateEmailPref} className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="emailNotifications"
              defaultChecked={user.emailNotifications}
              className="mt-0.5 h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-300"
            />
            <span>
              <span className="text-sm font-medium text-gray-800">
                {t("Recevoir les annonces, réunions et messages par e-mail")}
              </span>
              <span className="block text-xs text-gray-500">
                {t("Les notifications restent visibles dans l'app quoi qu'il arrive.")}
              </span>
            </span>
          </label>
          <Button type="submit">{t("Enregistrer")}</Button>
        </form>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">
          {t("Changer mon mot de passe")}
        </h2>
        <ChangePasswordForm />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-gray-800">
          {t("Mes données personnelles")}
        </h2>
        {delerror === "lastadmin" ? (
          <div className="mb-3">
            <Alert kind="error">
              {t(
                "Vous êtes le dernier administrateur : nommez un autre référent avant de supprimer votre compte.",
              )}
            </Alert>
          </div>
        ) : null}
        <p className="mb-3 text-sm text-gray-600">
          {t(
            "Vous pouvez exporter une copie de vos données, ou supprimer définitivement votre compte.",
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/compte/export"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            ⬇️ {t("Exporter mes données")}
          </a>
          <form action={deleteMyAccount}>
            <ConfirmButton
              variant="danger"
              confirmMessage={t(
                "Supprimer définitivement votre compte ? Vos données personnelles et votre accès seront effacés (vos contributions resteront anonymes). Cette action est irréversible.",
              )}
            >
              {t("Supprimer mon compte")}
            </ConfirmButton>
          </form>
        </div>
      </Card>
    </div>
  );
}
