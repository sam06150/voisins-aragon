import { PrismaClient } from "@prisma/client";

// La base Neon (offre gratuite) se met en veille après quelques minutes
// d'inactivité. On laisse à Prisma le temps d'attendre son réveil au lieu
// d'échouer sur la première requête (sinon : "server error, reload").
function resilientDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("connect_timeout"))
      u.searchParams.set("connect_timeout", "30");
    if (!u.searchParams.has("pool_timeout"))
      u.searchParams.set("pool_timeout", "30");
    return u.toString();
  } catch {
    return url;
  }
}

// Singleton Prisma pour survivre au hot-reload de Next.js en développement.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const datasourceUrl = resilientDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(datasourceUrl ? { datasourceUrl } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
