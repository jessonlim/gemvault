/**
 * Demo oripa seeder — creates a ready-to-play Pokémon oripa series.
 *
 * What it does:
 *   1. Finds an ADMIN profile (or promotes the oldest account to ADMIN)
 *   2. Picks real chase cards from the imported Pokémon catalog
 *   3. Creates a 20-pack series with S/A/B/C/D tiers + a Last One prize
 *   4. Activates it (shuffles prizes into numbered packs)
 *   5. Grants the admin 10 draw credits so you can test immediately
 *
 * Safe to re-run — each run creates a fresh series with a numbered title.
 *
 * Usage: npx tsx prisma/demo-oripa.ts
 */
import { PrismaClient, Game, OripaTier, Prisma } from "@prisma/client";

const db = new PrismaClient();

/** Pick one card matching the criteria, with fallbacks if the catalog differs. */
async function pickCard(
  wheres: Prisma.CardWhereInput[]
): Promise<{ id: string; cardCode: string; name: string; rarity: string } | null> {
  for (const where of wheres) {
    const card = await db.card.findFirst({
      where: { game: Game.POKEMON, imageUrl: { not: null }, ...where },
      select: { id: true, cardCode: true, name: true, rarity: true },
    });
    if (card) return card;
  }
  return null;
}

async function main() {
  // ----- 1. Find or promote an admin -----
  let admin = await db.profile.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    admin = await db.profile.findFirst({ orderBy: { createdAt: "asc" } });
    if (!admin) throw new Error("No profiles exist yet — sign up in the app first, then re-run.");
    admin = await db.profile.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
    console.log(`👑 Promoted @${admin.username} to ADMIN (no admin existed).`);
  }
  console.log(`Using admin: @${admin.username}`);

  // ----- 2. Pick prize cards from the catalog -----
  const sPrize = await pickCard([
    { name: { contains: "Charizard" }, rarity: "Special Illustration Rare" },
    { name: { contains: "Charizard" }, rarity: "Rare Rainbow" },
    { name: { contains: "Charizard" }, rarity: { contains: "Rare" } },
  ]);
  const lastOne = await pickCard([
    { name: { contains: "Umbreon" }, rarity: { in: ["Special Illustration Rare", "Illustration Rare", "Rare Rainbow"] } },
    { name: { contains: "Umbreon" }, rarity: { contains: "Rare" } },
    { name: { contains: "Rayquaza" }, rarity: { contains: "Rare" } },
  ]);
  const aPrize = await pickCard([
    { name: { contains: "Pikachu" }, rarity: { in: ["Illustration Rare", "Special Illustration Rare", "Rare Secret"] } },
    { name: { contains: "Pikachu" }, rarity: { contains: "Rare" } },
  ]);
  const bPrize = await pickCard([
    { name: { contains: "Mewtwo" }, rarity: { contains: "Rare" } },
    { name: { contains: "Gengar" }, rarity: { contains: "Rare" } },
  ]);
  const cPrize = await pickCard([
    { rarity: "Rare Holo", cardType: "POKEMON" },
  ]);
  const dPrize = await pickCard([
    { rarity: "Common", cardType: "POKEMON", name: { contains: "Eevee" } },
    { rarity: "Common", cardType: "POKEMON" },
  ]);

  if (!sPrize || !aPrize || !bPrize || !cPrize || !dPrize) {
    throw new Error("Couldn't find enough Pokémon cards — did the import run? (npm run db:import-pokemon)");
  }

  console.log(`\nPrize lineup:`);
  console.log(`  S (×1): ${sPrize.name} — ${sPrize.cardCode} (${sPrize.rarity})`);
  console.log(`  A (×2): ${aPrize.name} — ${aPrize.cardCode} (${aPrize.rarity})`);
  console.log(`  B (×3): ${bPrize.name} — ${bPrize.cardCode} (${bPrize.rarity})`);
  console.log(`  C (×6): ${cPrize.name} — ${cPrize.cardCode} (${cPrize.rarity})`);
  console.log(`  D (×8): ${dPrize.name} — ${dPrize.cardCode} (${dPrize.rarity})`);
  if (lastOne) console.log(`  LAST ONE: ${lastOne.name} — ${lastOne.cardCode} (${lastOne.rarity})`);

  // ----- 3. Create the series -----
  const demoCount = await db.oripaSeries.count({ where: { title: { startsWith: "Pokémon Demo Oripa" } } });
  const series = await db.oripaSeries.create({
    data: {
      title: `Pokémon Demo Oripa Vol. ${demoCount + 1}`,
      description:
        "Demo series seeded with real catalog cards — 20 packs, 1 grand prize, last-one bonus. " +
        "This is test data: no real cards will be shipped!",
      game: Game.POKEMON,
      pricePerDrawMyr: 10,
      createdById: admin.id,
      status: "DRAFT",
    },
  });

  const prizeSpecs: { tier: OripaTier; card: typeof sPrize; qty: number; est: number; isLastOne?: boolean }[] = [
    { tier: "S", card: sPrize, qty: 1, est: 400 },
    { tier: "A", card: aPrize, qty: 2, est: 120 },
    { tier: "B", card: bPrize, qty: 3, est: 50 },
    { tier: "C", card: cPrize, qty: 6, est: 15 },
    { tier: "D", card: dPrize, qty: 8, est: 3 },
  ];
  if (lastOne) prizeSpecs.push({ tier: "A", card: lastOne, qty: 1, est: 150, isLastOne: true });

  const createdPrizes = [];
  for (const spec of prizeSpecs) {
    const prize = await db.oripaPrize.create({
      data: {
        seriesId: series.id,
        tier: spec.tier,
        name: `${spec.card!.name} (${spec.card!.cardCode})`,
        cardId: spec.card!.id,
        quantity: spec.qty,
        estValueMyr: spec.est,
        isLastOne: spec.isLastOne ?? false,
      },
    });
    createdPrizes.push(prize);
  }

  // ----- 4. Activate: expand + shuffle into numbered slots -----
  const pool: string[] = [];
  for (const p of createdPrizes.filter((p) => !p.isLastOne)) {
    for (let i = 0; i < p.quantity; i++) pool.push(p.id);
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  await db.$transaction(async (tx) => {
    await tx.oripaSlot.createMany({
      data: pool.map((prizeId, idx) => ({ seriesId: series.id, slotNumber: idx + 1, prizeId })),
    });
    await tx.oripaSeries.update({
      where: { id: series.id },
      data: { status: "ACTIVE", totalSlots: pool.length, activatedAt: new Date() },
    });
  });

  // ----- 5. Grant the admin test credits -----
  await db.oripaCredit.upsert({
    where: { seriesId_userId: { seriesId: series.id, userId: admin.id } },
    update: { credits: { increment: 10 } },
    create: { seriesId: series.id, userId: admin.id, credits: 10, grantedById: admin.id },
  });

  console.log(`\n✅ "${series.title}" is LIVE with ${pool.length} packs.`);
  console.log(`   @${admin.username} has 10 draw credits.`);
  console.log(`   Local:      http://localhost:3000/oripa/${series.id}`);
  console.log(`   Production: https://gemvault-two.vercel.app/oripa/${series.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
