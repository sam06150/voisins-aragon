import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLocale } from "@/lib/i18n";
import { dirFor } from "@/lib/i18n-shared";
import { I18nProvider } from "@/components/I18nProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "Voisins Collectif et en Colère — Résidence Aragon",
  description:
    "Plateforme des locataires de la Résidence Aragon : annuaire, signalements, forum, annonces et documents.",
  applicationName: "Voisins Aragon",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Voisins Aragon",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#e11d48",
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dir = dirFor(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <ServiceWorkerRegistrar />
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
