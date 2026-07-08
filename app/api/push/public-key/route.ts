import { NextResponse } from "next/server";
import { vapidPublicKey } from "@/lib/push";

// Clé publique VAPID, nécessaire au navigateur pour s'abonner (non secrète).
export function GET() {
  const key = vapidPublicKey();
  if (!key) {
    return NextResponse.json({ error: "Push non configuré." }, { status: 503 });
  }
  return NextResponse.json({ key });
}
