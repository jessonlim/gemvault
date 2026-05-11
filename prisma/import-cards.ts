/**
 * Card importer for GemVault.
 *
 * Pulls One Piece TCG card data from the community-maintained "Punk Records"
 * dataset (https://github.com/buhbbl/punk-records), which is itself generated
 * from the official OPTCG card list. We clone the repo (or pull if already
 * cloned) into prisma/data/punk-records, then walk every English card file
 * and upsert sets and cards into our database.
 *
 * Idempotent — safe to re-run any time. Re-runs will refresh existing rows
 * and add any new cards released since the last import.
 *
 * Usage: npm run db:import
 */
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient, CardLanguage } from "@prisma/client";

const REPO_URL = "https://github.com/buhbbl/punk-records.git";
const DATA_DIR = path.join(__dirname, "data", "punk-records");
const LANG_DIR = path.join(DATA_DIR, "english");

const db = new PrismaClient();

// -------- mapping helpers --------

/**
 * Punk Records uses friendly names; our schema uses short codes.
 */
const RARITY_MAP: Record<string, string> = {
  Common: "C",
  Uncommon: "UC",
  Rare: "R",
  SuperRare: "SR",
  SecretRare: "SEC",
  Leader: "L",
  Special: "SP",
  TreasureRare: "TR",
  Promo: "P",
};

const CATEGORY_MAP: Record<string, string> = {
  Leader: "LEADER",
  Character: "CHARACTER",
  Event: "EVENT",
  Stage: "STAGE",
  Don: "DON", // skipped — Don!! cards aren't tradeable in our context
};

interface PunkPack {
  id: string;
  raw_title: string;
  title_parts: {
    label: string | null;
    prefix: string | null;
    title: string | null;
  };
}

/**
 * Convert a Punk Records pack into our { code, name } shape.
 * Examples:
 *   "ST-01" → "ST01"
 *   "OP-01" → "OP01"
 *   "OP14-EB04" → "OP14" (compound labels — take first segment)
 *   null label + "Promotion card" → { code: "PROMO", name: "Promotional Cards" }
 */
function packToSet(pack: PunkPack): { code: string; name: string } | null {
  const { label, title } = pack.title_parts;

  if (label) {
    // Strip the dash inside the label (OP-01 → OP01) and keep only the first segment
    // for compound labels (OP14-EB04 → OP14).
    const firstSegment = label.split("-").slice(0, 2).join("");
    const code = firstSegment.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const name = title ? cleanTitle(title) : code;
    return { code, name };
  }

  if (/promotion/i.test(pack.raw_title)) return { code: "PROMO", name: "Promotional Cards" };
  if (/other product/i.test(pack.raw_title)) return { code: "OTHER", name: "Other Products" };
  return null;
}

function cleanTitle(s: string): string {
  // Decode common HTML entities the source includes (e.g. "Ace &amp; Newgate")
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

interface PunkCard {
  id: string;
  pack_id: string;
  name: string;
  rarity: string;
  category: string;
  img_url?: string;
  img_full_url?: string;
  colors?: string[];
  cost?: number | null;
  attributes?: string[];
  power?: number | null;
  counter?: number | null;
  types?: string[];
  effect?: string | null;
  trigger?: string | null;
  life?: number | null;
}

// -------- main --------

async function main() {
  ensureRepo();

  if (!fs.existsSync(LANG_DIR)) {
    throw new Error(`English data dir missing at ${LANG_DIR}`);
  }

  const packsPath = path.join(LANG_DIR, "packs.json");
  const packsObj: Record<string, PunkPack> = JSON.parse(
    fs.readFileSync(packsPath, "utf-8")
  );
  const packs = Object.values(packsObj);

  // ----- 1. Upsert sets -----
  console.log(`Found ${packs.length} packs. Upserting sets...`);
  const packIdToSetId = new Map<string, string>();
  // Multiple packs can map to the same set code (e.g., compound labels) — cache the set rows
  const setCache = new Map<string, string>();

  for (const pack of packs) {
    const parsed = packToSet(pack);
    if (!parsed) {
      console.warn(`  ⚠️  Skipping pack with unparseable title: ${pack.raw_title}`);
      continue;
    }

    let setId = setCache.get(parsed.code);
    if (!setId) {
      const set = await db.cardSet.upsert({
        where: { code: parsed.code },
        update: { name: parsed.name },
        create: { code: parsed.code, name: parsed.name },
      });
      setId = set.id;
      setCache.set(parsed.code, setId);
    }
    packIdToSetId.set(pack.id, setId);
  }
  console.log(`  ✅ ${setCache.size} unique sets ready (across ${packs.length} packs).`);

  // ----- 2. Upsert cards -----
  let cardCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const [packId, setId] of packIdToSetId.entries()) {
    const packDir = path.join(LANG_DIR, "cards", packId);
    if (!fs.existsSync(packDir)) continue;

    const files = fs.readdirSync(packDir).filter((f) => f.endsWith(".json"));
    console.log(`  📦 Pack ${packId}: ${files.length} card files`);

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(packDir, file), "utf-8");
        const card: PunkCard = JSON.parse(raw);

        // Skip Don!! cards — not tradeable
        if (card.category === "Don" || card.category === "Don!!") {
          skippedCount += 1;
          continue;
        }

        const cardType = CATEGORY_MAP[card.category];
        if (!cardType) {
          skippedCount += 1;
          continue;
        }

        const rarity = RARITY_MAP[card.rarity] ?? card.rarity;

        // Each file becomes one Card row — including parallels and alt arts,
        // so collectors can pick the exact visual variant.
        const baseName = file.replace(/\.json$/, "");
        const isParallel = /_p\d+$/i.test(baseName);
        const isAlternateArt = /_alt$/i.test(baseName);

        // For parallels we use the filename-based code so they don't collide
        // with the base card's id.
        const cardCode = baseName === card.id ? card.id : baseName.toUpperCase();

        await db.card.upsert({
          where: { cardCode },
          update: {
            name: card.name,
            setId,
            rarity,
            cardType,
            colors: card.colors ?? [],
            cost: card.cost ?? null,
            power: card.power ?? null,
            counter: card.counter ?? null,
            life: card.life ?? null,
            attribute: card.attributes?.join(", ") ?? null,
            effectText: card.effect ?? null,
            triggerText: card.trigger ?? null,
            imageUrl: card.img_full_url ?? null,
            isAlternateArt,
            isParallel,
            isPromo: rarity === "P",
            languages: [CardLanguage.EN],
          },
          create: {
            cardCode,
            name: card.name,
            setId,
            rarity,
            cardType,
            colors: card.colors ?? [],
            cost: card.cost ?? null,
            power: card.power ?? null,
            counter: card.counter ?? null,
            life: card.life ?? null,
            attribute: card.attributes?.join(", ") ?? null,
            effectText: card.effect ?? null,
            triggerText: card.trigger ?? null,
            imageUrl: card.img_full_url ?? null,
            isAlternateArt,
            isParallel,
            isPromo: rarity === "P",
            languages: [CardLanguage.EN],
          },
        });
        cardCount += 1;
      } catch (err) {
        errorCount += 1;
        console.warn(`     ⚠️  Failed ${file}: ${(err as Error).message}`);
      }
    }
  }

  console.log("");
  console.log(`✅ Import complete:`);
  console.log(`   ${cardCount} cards upserted`);
  console.log(`   ${skippedCount} skipped (Don!! / unknown category)`);
  console.log(`   ${errorCount} errors`);
}

function ensureRepo() {
  const dataParent = path.dirname(DATA_DIR);
  if (!fs.existsSync(dataParent)) fs.mkdirSync(dataParent, { recursive: true });

  if (!fs.existsSync(path.join(DATA_DIR, ".git"))) {
    console.log("📥 Cloning punk-records dataset...");
    if (fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true, force: true });
    execSync(`git clone --depth 1 ${REPO_URL} "${DATA_DIR}"`, { stdio: "inherit" });
  } else {
    console.log("🔄 Updating punk-records dataset...");
    try {
      execSync(`git -C "${DATA_DIR}" pull --ff-only`, { stdio: "inherit" });
    } catch {
      console.warn("  ⚠️  git pull failed — continuing with cached data");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
