import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth";
import { registerAttempt } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Anti-abus : l'inscription est publique et déclenche un hashPassword coûteux.
  // On limite le nombre de tentatives par IP pour éviter la création en masse.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = registerAttempt(`signup:${ip}`);
  if (!rl.allowed) {
    const minutes = Math.ceil((rl.retryAfterSec ?? 0) / 60);
    return NextResponse.json(
      {
        error: `Trop de tentatives. Réessayez dans environ ${minutes} minute(s).`,
      },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Si un bâtiment existant est sélectionné, on vérifie qu'il existe.
  // Sinon le locataire a tapé le nom de son bâtiment (résolu par l'admin).
  // Cloisonnement : si un bâtiment existant est choisi, on rattache d'emblée le
  // compte à sa résidence. Sinon residenceId reste null jusqu'à la validation.
  let residenceId: string | null = null;
  if (data.buildingId) {
    const building = await prisma.building.findUnique({
      where: { id: data.buildingId },
      select: { id: true, residenceId: true },
    });
    if (!building) {
      return NextResponse.json({ error: "Bâtiment inconnu." }, { status: 400 });
    }
    residenceId = building.residenceId;
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet e-mail." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(data.password);
  try {
    await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ? data.phone : null,
        signupResidenceName: data.residenceName ? data.residenceName : null,
        signupBuildingName: data.buildingName ? data.buildingName : null,
        signupBuildingId: data.buildingId ? data.buildingId : null,
        signupUnitLabel: data.unitLabel,
        residenceId, // cloisonnement : déduit du bâtiment choisi (sinon null)
        consentAt: new Date(),
        status: "PENDING",
        role: "TENANT",
      },
    });
  } catch (e) {
    // Course entre deux inscriptions du même e-mail : la contrainte unique
    // lève P2002 → on renvoie un 409 clair plutôt qu'une erreur 500.
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet e-mail." },
        { status: 409 },
      );
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
