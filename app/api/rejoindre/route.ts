import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { joinRequestSchema } from "@/lib/validation";
import { registerAttempt } from "@/lib/rate-limit";

/**
 * Dépôt d'une candidature publique (référent ou locataire).
 *
 * Route ouverte : elle est la porte d'entrée des campagnes (TikTok, affiche).
 * Elle ne crée AUCUN compte et ne donne accès à rien — un référent traite la
 * demande depuis /admin/candidatures.
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = registerAttempt(`join:${ip}`);
  if (!rl.allowed) {
    const minutes = Math.ceil((rl.retryAfterSec ?? 0) / 60);
    return NextResponse.json(
      { error: `Trop de demandes. Réessayez dans environ ${minutes} minute(s).` },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = joinRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Doublon exact non traité : on répond OK sans recréer, pour éviter les
  // envois multiples depuis un formulaire re-soumis.
  const existing = await prisma.joinRequest.findFirst({
    where: {
      email: d.email,
      residenceName: d.residenceName,
      status: { in: ["NOUVEAU", "CONTACTE"] },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await prisma.joinRequest.create({
    data: {
      kind: d.kind,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone || null,
      city: d.city,
      postalCode: d.postalCode || null,
      country: d.country.toUpperCase(),
      landlord: d.landlord || null,
      residenceName: d.residenceName,
      buildingName: d.buildingName || null,
      message: d.message || null,
      consentAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
