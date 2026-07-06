import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

export const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export class UploadError extends Error {}

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

/**
 * Sauvegarde un fichier téléversé dans /uploads/<subdir> et renvoie
 * le chemin RELATIF (séparateurs "/") à stocker en base.
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

  const safeSub = sanitizeSubdir(subdir);
  const dir = path.join(UPLOADS_ROOT, safeSub);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}-${sanitizeFilename(file.name)}`;
  const dest = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buffer);

  return path.posix.join(safeSub, filename);
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
