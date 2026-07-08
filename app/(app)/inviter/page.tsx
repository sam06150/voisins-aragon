import QRCode from "qrcode";
import { requireApproved } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { Card, PageHeader } from "@/components/ui";
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

        <p className="mt-6 text-xs text-gray-400">
          {t("Astuce : vos voisins peuvent scanner le QR code avec l'appareil photo de leur téléphone.")}
        </p>
      </Card>
    </div>
  );
}
