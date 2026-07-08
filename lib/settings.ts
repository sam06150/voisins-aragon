import { prisma } from "./db";

export async function getSetting(key: string): Promise<string | null> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/** Nom de la résidence choisi par le collectif (vide si non renseigné). */
export async function getResidenceName(): Promise<string> {
  return (await getSetting("residence_name")) ?? "";
}
