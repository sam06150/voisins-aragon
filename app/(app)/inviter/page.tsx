import QRCode from "qrcode";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { Card, PageHeader } from "@/components/ui";
import InstallAppButton from "@/components/InstallAppButton";
import CopyLinkButton from "./CopyLinkButton";

export default async function InviterPage() {
  await requireApproved();
  const { t } = await getI18n();

  const url = process.env.APP_URL || "https://voisins-aragon.onrender.com";
  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: 240,
    color: { dark: "#111827", light: "#ffffff" },
  });

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={t("Inviter des voisins")}
        description={t(
          "Partagez ce QR code ou ce lien avec vos voisins pour qu'ils rejoignent la plateforme. Chaque inscription sera vérifiée par un référent.",
        )}
      />

      <Card className="text-center">
        <div
          className="mx-auto w-fit rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 [&_svg]:h-56 [&_svg]:w-56"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />

        <p className="mt-4 break-all text-sm font-medium text-gray-700">{url}</p>

        <div className="mt-4">
          <CopyLinkButton url={url} />
        </div>

        <p className="mt-6 text-xs text-gray-500">
          {t("Astuce : vos voisins peuvent scanner le QR code avec l'appareil photo de leur téléphone.")}
        </p>
      </Card>

      <Card className="mt-4 text-center">
        <h2 className="text-sm font-semibold text-gray-900">
          {t("Installer l'application")}
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          {t("Ajoutez l'appli à l'écran d'accueil pour l'ouvrir comme une vraie application.")}
        </p>
        <div className="mt-3 flex justify-center">
          <InstallAppButton />
        </div>
      </Card>
    </div>
  );
}
