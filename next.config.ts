import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Les pièces jointes (photos, PDF) transitent par des Server Actions.
      // Défaut Next.js = 1 Mo ; on l'aligne sur la limite de 10 Mo/fichier (+ marge).
      bodySizeLimit: "12mb",
    },
  },
  // En-têtes de sécurité appliqués à toutes les réponses.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Empêche l'inclusion du site dans une iframe (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          // Empêche le navigateur de deviner le type MIME.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Ne fuite pas l'URL complète vers les sites tiers.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Force HTTPS pendant 2 ans (Render sert déjà en HTTPS).
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Réduit l'accès aux API sensibles du navigateur.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
