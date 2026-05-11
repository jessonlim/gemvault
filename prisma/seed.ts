/**
 * Seed script — minimal starter data for development.
 *
 * Run with: npm run db:seed
 *
 * For production, replace this with a real importer that pulls
 * the official One Piece TCG card list (e.g. from the public site
 * or a community dataset). Intentionally tiny here.
 */
import { PrismaClient, CardLanguage } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding card sets...");

  const sets = [
    { code: "OP01", name: "Romance Dawn" },
    { code: "OP02", name: "Paramount War" },
    { code: "OP03", name: "Pillars of Strength" },
    { code: "OP04", name: "Kingdoms of Intrigue" },
    { code: "OP05", name: "Awakening of the New Era" },
    { code: "OP06", name: "Wings of the Captain" },
    { code: "OP07", name: "500 Years in the Future" },
    { code: "OP08", name: "Two Legends" },
    { code: "OP09", name: "Emperors in the New World" },
    { code: "ST01", name: "Starter Deck — Straw Hat Crew" },
    { code: "ST02", name: "Starter Deck — Worst Generation" },
    { code: "ST03", name: "Starter Deck — Seven Warlords of the Sea" },
  ];

  for (const s of sets) {
    await db.cardSet.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: s,
    });
  }

  console.log("Seeding sample cards...");

  const op01 = await db.cardSet.findUnique({ where: { code: "OP01" } });
  if (!op01) throw new Error("OP01 missing");

  const sampleCards = [
    {
      cardCode: "OP01-001",
      name: "Roronoa Zoro",
      rarity: "L",
      cardType: "LEADER",
      colors: ["Green"],
      power: 5000,
      life: 5,
      attribute: "Slash",
      effectText: "Activate: Main Once Per Turn DON!! −1 (You may return the specified number of DON!! cards from your field to your DON!! deck.): Set up to 1 of your Characters as active.",
      languages: ["EN", "JP"] as CardLanguage[],
    },
    {
      cardCode: "OP01-002",
      name: "Monkey D. Luffy",
      rarity: "L",
      cardType: "LEADER",
      colors: ["Red"],
      power: 5000,
      life: 5,
      attribute: "Strike",
      effectText: "Activate: Main Once Per Turn You may rest your DON!! deck and place 2 cards from the top of your deck on the bottom of your deck in any order: Choose 1 of your characters of cost 5 or less, and rest 1 of your opponent's characters of equal or lower cost.",
      languages: ["EN", "JP"] as CardLanguage[],
    },
    {
      cardCode: "OP01-003",
      name: "Usopp",
      rarity: "C",
      cardType: "CHARACTER",
      colors: ["Red"],
      cost: 1,
      power: 1000,
      counter: 2000,
      attribute: "Ranged",
      languages: ["EN", "JP"] as CardLanguage[],
    },
    {
      cardCode: "OP01-013",
      name: "Sanji",
      rarity: "SR",
      cardType: "CHARACTER",
      colors: ["Red"],
      cost: 4,
      power: 6000,
      counter: 1000,
      attribute: "Strike",
      effectText: "DON!!×1 This Character gains +2000 Power during your turn.",
      languages: ["EN", "JP"] as CardLanguage[],
    },
    {
      cardCode: "OP01-025",
      name: "Nami",
      rarity: "SR",
      cardType: "CHARACTER",
      colors: ["Red"],
      cost: 1,
      power: 1000,
      counter: 1000,
      attribute: "Special",
      effectText: "Activate: Main You may rest this character: Add up to 1 DON!! card from your DON!! deck and set it as active.",
      languages: ["EN", "JP"] as CardLanguage[],
    },
  ];

  for (const c of sampleCards) {
    await db.card.upsert({
      where: { cardCode: c.cardCode },
      update: {},
      create: { ...c, setId: op01.id },
    });
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
