/**
 * Migration de rattachement (étape C du cloisonnement multi-résidences).
 *
 * À exécuter UNE fois sur une base mono-résidence existante (ex. Aragon), AVANT
 * d'ouvrir une 2ᵉ résidence. Idempotent : peut être relancé sans dommage.
 *
 *   npx tsx prisma/attach-residences.ts
 *
 * Ce script :
 *   1. garantit l'existence d'une résidence par défaut (nom repris du réglage
 *      `residence_name`, sinon « Résidence Aragon ») ;
 *   2. rattache à cette résidence tous les bâtiments qui n'en ont pas ;
 *   3. renseigne `User.residenceId` de chaque compte à partir de la résidence de
 *      son logement ; les comptes sans logement rattachés à la résidence par
 *      défaut (ils restent visibles là où ils l'étaient).
 *
 * Après exécution, tous les comptes existants sont bornés à leur résidence :
 * le cloisonnement devient effectif. Voir MULTI-RESIDENCES.md.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1) Résidence par défaut.
  const setting = await prisma.setting.findUnique({
    where: { key: "residence_name" },
  });
  const defaultName = (setting?.value?.trim() || "Résidence Aragon").slice(0, 80);

  let residence = await prisma.residence.findFirst({
    where: { name: defaultName },
  });
  residence ??= await prisma.residence.create({ data: { name: defaultName } });
  console.log(`Résidence par défaut : « ${residence.name} » (${residence.id})`);

  // 2) Bâtiments sans résidence → rattachés à la résidence par défaut.
  const orphanBuildings = await prisma.building.updateMany({
    where: { residenceId: null },
    data: { residenceId: residence.id },
  });
  console.log(`Bâtiments rattachés : ${orphanBuildings.count}`);

  // 3) Comptes : residenceId déduit du bâtiment du logement, défaut sinon.
  const users = await prisma.user.findMany({
    where: { residenceId: null },
    select: {
      id: true,
      unit: { select: { building: { select: { residenceId: true } } } },
    },
  });

  let attached = 0;
  for (const u of users) {
    const rid = u.unit?.building.residenceId ?? residence.id;
    await prisma.user.update({
      where: { id: u.id },
      data: { residenceId: rid },
    });
    attached++;
  }
  console.log(`Comptes rattachés : ${attached}`);

  console.log(
    "\nTerminé. Le cloisonnement est désormais effectif pour tous les comptes.\n" +
      "Étape suivante (facultative, après vérification) : passer\n" +
      "Building.residenceId en obligatoire dans prisma/schema.prisma, puis db push.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
