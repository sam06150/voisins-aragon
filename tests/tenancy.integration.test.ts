/**
 * Test d'intégration du cloisonnement (étape E).
 *
 * Vérifie contre une VRAIE base que les filtres de `lib/tenancy` empêchent un
 * compte de la résidence A de voir les données de la résidence B.
 *
 * Nécessite une base jetable : fournir `TEST_DATABASE_URL` (schéma déjà poussé
 * via `prisma db push`). Sans cette variable, la suite est ignorée — elle ne
 * casse donc pas `npm test` en local.
 *
 *   TEST_DATABASE_URL="postgresql://…/test" npx vitest run tenancy.integration
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  scopeFor,
  buildingScopeWhere,
  userScopeWhere,
} from "../lib/tenancy";

const DB = process.env.TEST_DATABASE_URL;
const run = DB ? describe : describe.skip;

run("cloisonnement — intégration deux résidences", () => {
  // Instancié dans beforeAll (jamais au moment de la collecte, pour ne pas
  // ouvrir de client Prisma quand la suite est ignorée).
  let prisma: PrismaClient;

  // Identifiants uniques pour ne pas heurter des données existantes.
  const tag = "itest_" + Math.abs(hashString(DB ?? "")).toString(36);
  const ids: { residences: string[]; buildings: string[]; users: string[]; incidents: string[] } =
    { residences: [], buildings: [], users: [], incidents: [] };

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: DB } } });
    for (const k of ["A", "B"] as const) {
      const res = await prisma.residence.create({
        data: { name: `${tag}_res_${k}` },
      });
      ids.residences.push(res.id);
      const b = await prisma.building.create({
        data: { name: `${tag}_bat_${k}`, code: `${tag}${k}`, residenceId: res.id },
      });
      ids.buildings.push(b.id);
      const u = await prisma.user.create({
        data: {
          email: `${tag}_${k}@test.local`,
          passwordHash: "x",
          firstName: "T",
          lastName: k,
          status: "APPROVED",
          residenceId: res.id,
        },
      });
      ids.users.push(u.id);
      const inc = await prisma.incidentReport.create({
        data: {
          title: `${tag}_inc_${k}`,
          description: "…",
          category: "AUTRE",
          buildingId: b.id,
          authorId: u.id,
        },
      });
      ids.incidents.push(inc.id);
    }
  });

  afterAll(async () => {
    await prisma.incidentReport.deleteMany({ where: { id: { in: ids.incidents } } });
    await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
    await prisma.building.deleteMany({ where: { id: { in: ids.buildings } } });
    await prisma.residence.deleteMany({ where: { id: { in: ids.residences } } });
    await prisma.$disconnect();
  });

  it("un signalement n'est visible que dans sa résidence", async () => {
    const scopeA = scopeFor({ residenceId: ids.residences[0] });

    const visibleToA = await prisma.incidentReport.findMany({
      where: { AND: [buildingScopeWhere(scopeA), { title: { startsWith: tag } }] },
      select: { title: true },
    });

    expect(visibleToA.map((i) => i.title)).toEqual([`${tag}_inc_A`]);
  });

  it("un compte n'apparaît dans l'annuaire que de sa résidence", async () => {
    const scopeB = scopeFor({ residenceId: ids.residences[1] });

    const usersForB = await prisma.user.findMany({
      where: { ...userScopeWhere(scopeB), email: { startsWith: tag } },
      select: { email: true },
    });

    expect(usersForB.map((u) => u.email)).toEqual([`${tag}_B@test.local`]);
  });

  it("un compte global (residenceId null) voit les deux résidences", async () => {
    const global = scopeFor({ residenceId: null });

    const all = await prisma.incidentReport.findMany({
      where: {
        AND: [buildingScopeWhere(global), { title: { startsWith: tag } }],
      },
      select: { title: true },
    });

    expect(all.length).toBe(2);
  });
});

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
