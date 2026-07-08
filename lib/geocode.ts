/**
 * Géocodage d'une adresse via Nominatim (OpenStreetMap), gratuit et sans clé.
 * Retourne des coordonnées (lat/lng) ou null. Best effort : ne jette jamais.
 */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = address.trim();
  if (!q) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        // Nominatim exige un User-Agent identifiant l'application.
        "User-Agent": "VoisinsCollectifEtEnColere/1.0 (contact: sdsb.2023@gmail.com)",
        "Accept-Language": "fr",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (Array.isArray(data) && data[0]) {
      const lat = Number.parseFloat(data[0].lat);
      const lng = Number.parseFloat(data[0].lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    return null;
  } catch {
    return null;
  }
}
