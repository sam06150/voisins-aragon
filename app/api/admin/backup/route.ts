import { promises as fs } from "fs";
import path from "path";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await requireAdmin();

  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  try {
    const data = await fs.readFile(dbPath);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="sauvegarde-aragon-${stamp}.db"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Base de données introuvable.", { status: 404 });
  }
}
