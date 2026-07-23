import { promises as fs } from "fs";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scopeFor } from "@/lib/tenancy";
import { contentTypeForPath, resolveUploadPath } from "@/lib/storage";

/**
 * Le fichier local (chemin relatif = filePath stocké) est-il visible par cette
 * résidence ? Il l'est s'il correspond à une photo de signalement ou à un
 * document rattaché à un bâtiment de la résidence (ou à un document général).
 *
 * NB : ne couvre que le stockage disque local. Avec Cloudinary, les fichiers
 * sont servis par une URL https publique (UUID non devinable) hors de cette
 * route : une isolation stricte entre résidences y nécessiterait des URLs
 * signées. Voir MULTI-RESIDENCES.md, étape D.
 */
async function fileVisibleToResidence(
  filePath: string,
  residenceId: string,
): Promise<boolean> {
  const [photo, doc] = await Promise.all([
    prisma.incidentPhoto.findFirst({
      where: { filePath, incident: { building: { residenceId } } },
      select: { id: true },
    }),
    prisma.document.findFirst({
      where: {
        filePath,
        OR: [{ buildingId: null }, { building: { residenceId } }],
      },
      select: { id: true },
    }),
  ]);
  return Boolean(photo || doc);
}

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

  // Cloisonnement : un compte rattaché ne peut lire que les fichiers de sa
  // résidence. Un compte global (mono-résidence historique) n'est pas restreint.
  const scope = scopeFor(user);
  if (
    scope.kind === "residence" &&
    !(await fileVisibleToResidence(relativePath, scope.residenceId))
  ) {
    return new Response("Non autorisé", { status: 403 });
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
