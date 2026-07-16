import { promises as fs } from "fs";
import { getCurrentUser } from "@/lib/auth";
import { contentTypeForPath, resolveUploadPath } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  // Fichiers réservés aux locataires connectés et approuvés.
  const user = await getCurrentUser();
  if (!user || user.status !== "APPROVED") {
    return new Response("Non autorisé", { status: 401 });
  }

  const { path: segments } = await params;
  const relativePath = segments.join("/");
  const absolute = resolveUploadPath(relativePath);
  if (!absolute) {
    return new Response("Chemin invalide", { status: 400 });
  }

  try {
    const data = await fs.readFile(absolute);
    const contentType = contentTypeForPath(absolute);
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      // Fichiers privés : pas de mise en cache pour que le contrôle
      // d'accès soit réévalué à chaque requête.
      "Cache-Control": "private, no-store",
    };
    // Les PDF sont forcés en téléchargement (jamais rendus inline dans l'onglet)
    // pour éviter tout script embarqué s'exécutant dans l'origine du site.
    if (contentType === "application/pdf") {
      headers["Content-Disposition"] = "attachment";
    }
    return new Response(new Uint8Array(data), { headers });
  } catch {
    return new Response("Fichier introuvable", { status: 404 });
  }
}
