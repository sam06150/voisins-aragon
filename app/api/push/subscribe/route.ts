import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.status !== "APPROVED") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let sub: unknown;
  try {
    sub = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const s = sub as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!s?.endpoint || !s.keys?.p256dh || !s.keys?.auth) {
    return NextResponse.json({ error: "Abonnement invalide" }, { status: 400 });
  }

  // Un même appareil (endpoint) est rattaché à l'utilisateur courant.
  await prisma.pushSubscription.upsert({
    where: { endpoint: s.endpoint },
    update: { userId: user.id, p256dh: s.keys.p256dh, auth: s.keys.auth },
    create: {
      userId: user.id,
      endpoint: s.endpoint,
      p256dh: s.keys.p256dh,
      auth: s.keys.auth,
    },
  });

  return NextResponse.json({ ok: true });
}
