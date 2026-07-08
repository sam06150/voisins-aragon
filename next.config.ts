import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Les pièces jointes (photos, PDF) transitent par des Server Actions.
      // Défaut Next.js = 1 Mo ; on l'aligne sur la limite de 10 Mo/fichier (+ marge).
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
