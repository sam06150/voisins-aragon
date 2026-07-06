import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
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

  const building = await prisma.building.findUnique({
    where: { id: data.buildingId },
  });
  if (!building) {
    return NextResponse.json({ error: "Bâtiment inconnu." }, { status: 400 });
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
  await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ? data.phone : null,
      signupBuildingId: data.buildingId,
      signupUnitLabel: data.unitLabel,
      status: "PENDING",
      role: "TENANT",
    },
  });

  return NextResponse.json({ ok: true });
}
