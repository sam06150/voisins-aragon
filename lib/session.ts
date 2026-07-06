import type { SessionOptions } from "iron-session";
import type { Role, AccountStatus } from "@prisma/client";

export interface SessionData {
  userId?: string;
  role?: Role;
  status?: AccountStatus;
}

const password = process.env.SESSION_SECRET;

if (!password || password.length < 32) {
  throw new Error(
    "SESSION_SECRET manquant ou trop court (32 caractères minimum). Vérifiez votre fichier .env.",
  );
}

export const sessionOptions: SessionOptions = {
  password,
  cookieName: "aragon_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  },
};

// Nom du cookie exposé pour le contrôle rapide de présence dans proxy.ts.
export const SESSION_COOKIE_NAME = "aragon_session";
