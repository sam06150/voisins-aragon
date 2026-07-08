import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/roles";

// Recherche d'adresses via Nominatim (OpenStreetMap). Réservé au staff.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.status !== "APPROVED" || !isStaff(user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json({ results: [] });

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "VoisinsCollectifEtEnColere/1.0 (contact: sdsb.2023@gmail.com)",
        "Accept-Language": "fr",
      },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ results: [] });
    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>;
    const results = (Array.isArray(data) ? data : []).map((r) => ({
      display_name: r.display_name,
      lat: r.lat,
      lon: r.lon,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
