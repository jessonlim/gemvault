/**
 * Pokémon TCG importer for GemVault.
 *
 * Pulls all English Pokémon cards from the official pokemontcg.io raw dataset
 * (https://github.com/PokemonTCG/pokemon-tcg-data — the JSON source behind the
 * API), mirroring the punk-records approach used for One Piece:
 * clone → walk sets/en.json + cards/en/*.json → write to our Card table.
 *
 * Notes from the source data (verified):
 *   - `hp` and `number` are STRINGS ("80", "TG01") — parse defensively
 *   - card objects don't embed their set — derived from the filename
 *   - `rarity` can be missing → stored as "Unspecified"
 *   - supertype is "Pokémon" (with é) | "Trainer" | "Energy"
 *   - images.large/.small are stable hotlink URLs on images.pokemontcg.io
 *
 * Speed: uses createMany in chunks (~20k cards in seconds) with
 * skipDuplicates, so re-runs only ADD new cards; existing rows are not
 * updated. Delete a row (or the lot) to force a refresh.
 *
 * Usage: npm run db:import-pokemon
 */
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient, Game, CardLanguage, Prisma } from "@prisma/client";

const REPO_URL = "https://github.com/PokemonTCG/pokemon-tcg-data.git";
const DATA_DIR = path.join(__dirname, "data", "pokemon-tcg-data");

const db = new PrismaClient();

interface PkmSet {
  id: string;
  name: string;
  series?: string;
  releaseDate?: string; // "YYYY/MM/DD"
  images?: { symbol?: string; logo?: string };
}

interface PkmCard {
  id: string; // "base1-4"
  name: string;
  supertype?: string; // "Pokémon" | "Trainer" | "Energy"
  subtypes?: string[];
  hp?: string;
  types?: string[];
  rules?: string[];
  abilities?: { name: string; text: string; type?: string }[];
  attacks?: { name: string; cost?: string[]; damage?: string; text?: string }[];
  rarity?: string;
  flavorText?: string;
  images?: { small?: string; large?: string };
}

const SUPERTYPE_MAP: Record<string, string> = {
  "Pokémon": "POKEMON",
  "Pokemon": "POKEMON", // just in case
  "Trainer": "TRAINER",
  "Energy": "ENERGY",
};

function buildEffectText(card: PkmCard): string | null {
  const parts: string[] = [];
  for (const a of card.abilities ?? []) {
    parts.push(`[${a.type ?? "Ability"}: ${a.name}] ${a.text}`);
  }
  for (const atk of card.attacks ?? []) {
    const cost = atk.cost?.length ? `{${atk.cost.join("/")}} ` : "";
    const dmg = atk.damage ? ` — ${atk.damage}` : "";
    const text = atk.text ? ` ${atk.text}` : "";
    parts.push(`${cost}${atk.name}${dmg}${text}`.trim());
  }
  for (const rule of card.rules ?? []) {
    parts.push(rule);
  }
  return parts.length > 0 ? parts.join("\n") : null;
}

function parseHp(hp?: string): number | null {
  if (!hp) return null;
  const n = parseInt(hp, 10);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  ensureRepo();

  const setsPath = path.join(DATA_DIR, "sets", "en.json");
  const cardsDir = path.join(DATA_DIR, "cards", "en");
  if (!fs.existsSync(setsPath) || !fs.existsSync(cardsDir)) {
    throw new Error("Dataset layout unexpected — sets/en.json or cards/en missing");
  }

  const sets: PkmSet[] = JSON.parse(fs.readFileSync(setsPath, "utf-8"));
  console.log(`Found ${sets.length} Pokémon sets. Upserting...`);

  // ----- 1. Upsert sets -----
  const setIdToDbId = new Map<string, string>();
  for (const s of sets) {
    const code = s.id.toUpperCase();
    const releaseDate = s.releaseDate ? new Date(s.releaseDate.replace(/\//g, "-")) : null;
    const row = await db.cardSet.upsert({
      where: { code },
      update: { name: s.name, game: Game.POKEMON, imageUrl: s.images?.logo ?? null },
      create: {
        code,
        name: s.name,
        game: Game.POKEMON,
        description: s.series ?? null,
        releaseDate: releaseDate && !isNaN(releaseDate.getTime()) ? releaseDate : null,
        imageUrl: s.images?.logo ?? null,
      },
    });
    setIdToDbId.set(s.id, row.id);
  }
  console.log(`  ✅ ${setIdToDbId.size} sets ready.`);

  // ----- 2. Bulk-insert cards per set -----
  let inserted = 0;
  let skippedFiles = 0;
  const files = fs.readdirSync(cardsDir).filter((f) => f.endsWith(".json"));
  console.log(`Importing cards from ${files.length} set files...`);

  for (const file of files) {
    const setId = file.replace(/\.json$/, "");
    const dbSetId = setIdToDbId.get(setId);
    if (!dbSetId) {
      console.warn(`  ⚠️  ${file}: set "${setId}" not in sets/en.json — skipped`);
      skippedFiles += 1;
      continue;
    }

    const cards: PkmCard[] = JSON.parse(
      fs.readFileSync(path.join(cardsDir, file), "utf-8")
    );

    const rows: Prisma.CardCreateManyInput[] = cards.map((c) => ({
      cardCode: c.id.toUpperCase(),
      name: c.name,
      setId: dbSetId,
      game: Game.POKEMON,
      rarity: c.rarity ?? "Unspecified",
      cardType: SUPERTYPE_MAP[c.supertype ?? ""] ?? "POKEMON",
      colors: c.types ?? [],
      power: parseHp(c.hp), // HP shown in the "power" column
      effectText: buildEffectText(c),
      triggerText: c.flavorText ?? null,
      imageUrl: c.images?.large ?? c.images?.small ?? null,
      languages: [CardLanguage.EN],
    }));

    // Chunked createMany — skipDuplicates makes re-runs additive
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const result = await db.card.createMany({ data: chunk, skipDuplicates: true });
      inserted += result.count;
    }
  }

  const totalPokemon = await db.card.count({ where: { game: Game.POKEMON } });
  console.log("");
  console.log(`✅ Pokémon import complete:`);
  console.log(`   ${inserted} new cards inserted this run`);
  console.log(`   ${totalPokemon} Pokémon cards total in database`);
  if (skippedFiles > 0) console.log(`   ${skippedFiles} set files skipped`);
}

function ensureRepo() {
  const dataParent = path.dirname(DATA_DIR);
  if (!fs.existsSync(dataParent)) fs.mkdirSync(dataParent, { recursive: true });

  if (!fs.existsSync(path.join(DATA_DIR, ".git"))) {
    console.log("📥 Cloning pokemon-tcg-data (~shallow)...");
    if (fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true, force: true });
    execSync(`git clone --depth 1 ${REPO_URL} "${DATA_DIR}"`, { stdio: "inherit" });
  } else {
    console.log("🔄 Updating pokemon-tcg-data...");
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
