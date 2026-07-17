import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

export const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export class UploadError extends Error {}

/**
 * Vérifie que le contenu réel du fichier (ses premiers octets) correspond au
 * type MIME annoncé par le client (qui est falsifiable). Défense en profondeur.
 */
export function hasValidMagicBytes(buf: Buffer, mime: string): boolean {
  if (buf.length < 4) return false;
  switch (mime) {
    case "image/jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case "image/png":
      return (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47
      );
    case "image/webp":
      return (
        buf.length >= 12 &&
        buf.toString("ascii", 0, 4) === "RIFF" &&
        buf.toString("ascii", 8, 12) === "WEBP"
      );
    case "application/pdf":
      return buf.toString("ascii", 0, 5) === "%PDF-";
    default:
      return false;
  }
}

// --- Stockage durable en ligne (Cloudinary), activé si les variables
//     d'environnement sont présentes ; sinon on retombe sur le disque local. ---
const CLOUDINARY_ENABLED = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

if (CLOUDINARY_ENABLED) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function isCloudinaryEnabled(): boolean {
  return CLOUDINARY_ENABLED;
}

function sanitizeSubdir(subdir: string): string {
  // On n'autorise que des sous-dossiers simples (lettres, chiffres, - _ /).
  return subdir
    .split("/")
    .map((seg) => seg.replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean)
    .join("/");
}

function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, 80) || "fichier";
}

async function saveToCloudinary(
  buffer: Buffer,
  mime: string,
  safeSub: string,
): Promise<string> {
  const dataUri = `data:${mime};base64,${buffer.toString("base64")}`;
  const isPdf = mime === "application/pdf";
  // Les PDF sont envoyés en "raw" (livraison fiable, sans restriction PDF/ZIP) ;
  // les images en "image". On garde l'extension .pdf dans l'URL pour le navigateur.
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `voisins-aragon/${safeSub}`,
    resource_type: isPdf ? "raw" : "image",
    public_id: randomUUID() + (isPdf ? ".pdf" : ""),
    overwrite: false,
  });
  return result.secure_url;
}

/**
 * Sauvegarde un fichier téléversé.
 * - Avec Cloudinary : renvoie l'URL https durable (stockée telle quelle en base).
 * - Sans Cloudinary : écrit dans /uploads/<subdir> et renvoie le chemin RELATIF.
 */
export async function saveUploadedFile(
  file: File,
  subdir: string,
): Promise<string> {
  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    throw new UploadError(
      "Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WEBP, PDF.",
    );
  }
  if (file.size <= 0) {
    throw new UploadError("Fichier vide.");
  }
  if (file.size > MAX_SIZE) {
    throw new UploadError("Fichier trop volumineux (10 Mo maximum).");
  }

  // On lit le contenu une seule fois et on vérifie que ses octets d'en-tête
  // correspondent bien au type annoncé (le MIME client est falsifiable).
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidMagicBytes(buffer, file.type)) {
    throw new UploadError(
      "Le contenu du fichier ne correspond pas à son type (JPEG, PNG, WEBP ou PDF).",
    );
  }

  const safeSub = sanitizeSubdir(subdir);

  if (CLOUDINARY_ENABLED) {
    return saveToCloudinary(buffer, file.type, safeSub);
  }

  const dir = path.join(UPLOADS_ROOT, safeSub);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}-${sanitizeFilename(file.name)}`;
  const dest = path.join(dir, filename);

  await fs.writeFile(dest, buffer);

  return path.posix.join(safeSub, filename);
}

/**
 * URL publique d'un fichier stocké : une URL Cloudinary (http...) est renvoyée
 * telle quelle ; un chemin local passe par la route authentifiée /api/uploads.
 */
export function publicFileUrl(filePath: string): string {
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `/api/uploads/${filePath}`;
}

/**
 * Supprime un fichier stocké (best effort) : Cloudinary ou disque local.
 */
export async function deleteStoredFile(filePath: string): Promise<void> {
  if (/^https?:\/\//i.test(filePath)) {
    try {
      // On déduit le resource_type et le public_id depuis l'URL Cloudinary.
      const m = filePath.match(/\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/);
      if (m) {
        const resourceType = m[1] as "image" | "raw" | "video";
        let publicId = m[2];
        if (resourceType === "image") {
          publicId = publicId.replace(/\.[^/.]+$/, ""); // retirer l'extension
        }
        await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
          invalidate: true,
        });
      }
    } catch {
      // best effort : on ignore les erreurs de suppression distante
    }
    return;
  }
  const absolute = resolveUploadPath(filePath);
  if (absolute) {
    try {
      await fs.unlink(absolute);
    } catch {
      // fichier déjà absent : on ignore
    }
  }
}

/**
 * Résout un chemin relatif stocké en base vers un chemin absolu SÛR,
 * en bloquant toute tentative de sortie du dossier /uploads (path traversal).
 * Renvoie null si le chemin est invalide.
 */
export function resolveUploadPath(relativePath: string): string | null {
  const resolved = path.resolve(UPLOADS_ROOT, relativePath);
  const root = path.resolve(UPLOADS_ROOT);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return null;
  }
  return resolved;
}

/** Type MIME à renvoyer au client d'après l'extension. */
export function contentTypeForPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}
