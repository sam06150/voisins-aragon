import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, createSessionFor } from "@/lib/auth";
import {
  checkRateLimit,
  registerFailure,
  registerSuccess,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  // Clé de limitation : IP + e-mail visé.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rlKey = `${ip}:${email}`;

  const rl = checkRateLimit(rlKey);
  if (!rl.allowed) {
    const minutes = Math.ceil((rl.retryAfterSec ?? 0) / 60);
    return NextResponse.json(
      {
        error: `Trop de tentatives. Réessayez dans environ ${minutes} minute(s).`,
      },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    registerFailure(rlKey);
    return NextResponse.json(
      { error: "E-mail ou mot de passe incorrect." },
      { status: 401 },
    );
  }

  if (user.status === "REJECTED") {
    return NextResponse.json(
      {
        error:
          "Votre demande d'inscription a été refusée. Contactez un référent du collectif.",
      },
      { status: 403 },
    );
  }

  if (user.status === "SUSPENDED") {
    return NextResponse.json(
      {
        error:
          "Votre compte est en veille (accès suspendu). Contactez un référent du collectif pour le réactiver.",
      },
      { status: 403 },
    );
  }

  registerSuccess(rlKey);
  await createSessionFor(user);
  return NextResponse.json({ ok: true, status: user.status });
}
