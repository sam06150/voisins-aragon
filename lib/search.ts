const isPostgres = (process.env.DATABASE_URL ?? "").startsWith("postgres");

/**
 * Filtre Prisma « contient » insensible à la casse, portable :
 * - Postgres : LIKE est sensible à la casse → on ajoute `mode: "insensitive"`.
 * - SQLite (dev local) : LIKE est déjà insensible pour l'ASCII, et l'option
 *   `mode` n'y est pas supportée → on l'omet.
 */
export function textContains(query: string): {
  contains: string;
  mode?: "insensitive";
} {
  return isPostgres
    ? { contains: query, mode: "insensitive" }
    : { contains: query };
}
