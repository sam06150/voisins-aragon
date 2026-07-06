import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@aragon.local";
const ADMIN_PASSWORD = "ChangeMoi123!";

async function main() {
  console.log("Initialisation des données de la Résidence Aragon…");

  // 1) Les 4 bâtiments.
  const buildingDefs = [
    { code: "A", name: "Bâtiment A" },
    { code: "B", name: "Bâtiment B" },
    { code: "C", name: "Bâtiment C" },
    { code: "D", name: "Bâtiment D" },
  ];

  const buildings = [];
  for (const def of buildingDefs) {
    const building = await prisma.building.upsert({
      where: { code: def.code },
      update: { name: def.name },
      create: def,
    });
    buildings.push(building);

    // Quelques logements par bâtiment (étages 0 à 3, 2 logements par étage).
    for (let floor = 0; floor <= 3; floor++) {
      for (const side of ["Gauche", "Droite"]) {
        const label = `${floor === 0 ? "RDC" : floor} ${side}`;
        await prisma.unit.upsert({
          where: {
            buildingId_label: { buildingId: building.id, label },
          },
          update: {},
          create: { buildingId: building.id, floor, label },
        });
      }
    }
  }
  console.log(`  ✓ ${buildings.length} bâtiments et leurs logements`);

  // 2) Compte administrateur (référent) par défaut.
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", status: "APPROVED" },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      firstName: "Référent",
      lastName: "Aragon",
      role: "ADMIN",
      status: "APPROVED",
    },
  });
  console.log(`  ✓ Compte admin : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  // Compte administrateur personnalisé (connexion par identifiant "mrsds").
  const mrsdsHash = await bcrypt.hash("Aragon.49", 10);
  await prisma.user.upsert({
    where: { email: "mrsds" },
    update: { role: "ADMIN", status: "APPROVED", passwordHash: mrsdsHash },
    create: {
      email: "mrsds",
      passwordHash: mrsdsHash,
      firstName: "Mrsds",
      lastName: "Aragon",
      role: "ADMIN",
      status: "APPROVED",
    },
  });
  console.log("  ✓ Compte admin : mrsds / Aragon.49");

  // 3) Catégories de forum : une générale + une par bâtiment.
  const generalCat = await prisma.forumCategory.findFirst({
    where: { name: "Général", buildingId: null },
  });
  if (!generalCat) {
    await prisma.forumCategory.create({
      data: {
        name: "Général",
        description: "Discussions ouvertes à toutes les résidences.",
      },
    });
  }

  for (const building of buildings) {
    const exists = await prisma.forumCategory.findFirst({
      where: { name: building.name, buildingId: building.id },
    });
    if (!exists) {
      await prisma.forumCategory.create({
        data: {
          name: building.name,
          description: `Espace de discussion réservé au ${building.name}.`,
          buildingId: building.id,
        },
      });
    }
  }
  console.log("  ✓ Catégories de forum (Général + 1 par bâtiment)");

  // 4) Annonce de bienvenue épinglée.
  const welcome = await prisma.announcement.findFirst({
    where: { title: "Bienvenue sur la plateforme du collectif" },
  });
  if (!welcome) {
    await prisma.announcement.create({
      data: {
        title: "Bienvenue sur la plateforme du collectif",
        body:
          "Bienvenue aux locataires de la Résidence Aragon !\n\n" +
          "Cette plateforme nous permet de nous organiser : annuaire des voisins, " +
          "signalement des problèmes, forum de discussion, annonces, réunions et " +
          "documents partagés.\n\n" +
          "Inscrivez-vous, un référent validera votre compte, et rejoignez le collectif.",
        pinned: true,
        authorId: admin.id,
      },
    });
  }
  console.log("  ✓ Annonce de bienvenue");

  console.log("\nTerminé. Vous pouvez lancer « npm run dev » et vous connecter.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
