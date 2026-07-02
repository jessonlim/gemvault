import { Prisma, Game } from "@prisma/client";
import { db } from "@/lib/db";

export interface CardFilters {
  q?: string;
  game?: Game;
  setCode?: string;
  rarity?: string;
  cardType?: string;
  color?: string;
  page?: number;
  pageSize?: number;
}

export async function searchCards(filters: CardFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(60, filters.pageSize ?? 24);

  const where: Prisma.CardWhereInput = {};

  if (filters.game) where.game = filters.game;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { cardCode: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.rarity) where.rarity = filters.rarity;
  if (filters.cardType) where.cardType = filters.cardType;
  if (filters.color) where.colors = { has: filters.color };
  if (filters.setCode) {
    where.set = { code: filters.setCode };
  }

  const [cards, total] = await Promise.all([
    db.card.findMany({
      where,
      include: { set: { select: { code: true, name: true } } },
      orderBy: [{ cardCode: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.card.count({ where }),
  ]);

  return {
    cards,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCardByCode(cardCode: string) {
  return db.card.findUnique({
    where: { cardCode },
    include: { set: true },
  });
}

export async function getAllSets(game?: Game) {
  return db.cardSet.findMany({
    where: game ? { game } : undefined,
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
}

/**
 * Filter options per game, derived from actual data so new rarity strings
 * (Pokémon has dozens) appear automatically after an import.
 */
export async function getFilterOptions(game: Game) {
  const [rarities, cardTypes, colorRows] = await Promise.all([
    db.card.groupBy({ by: ["rarity"], where: { game }, orderBy: { rarity: "asc" } }),
    db.card.groupBy({ by: ["cardType"], where: { game }, orderBy: { cardType: "asc" } }),
    // colors is an array column — groupBy can't expand it, so use a raw distinct unnest
    db.$queryRaw<{ color: string }[]>`
      SELECT DISTINCT unnest(colors) AS color FROM "Card" WHERE game = ${game}::"Game" ORDER BY color ASC
    `,
  ]);

  return {
    rarities: rarities.map((r) => r.rarity),
    cardTypes: cardTypes.map((t) => t.cardType),
    colors: colorRows.map((c) => c.color),
  };
}

export const GAME_LABELS: Record<Game, string> = {
  ONE_PIECE: "One Piece",
  POKEMON: "Pokémon",
};

// Static fallbacks (One Piece) — still used by marketplace filters
export const RARITIES = ["C", "UC", "R", "SR", "SEC", "L", "SP", "TR", "P"] as const;
export const CARD_TYPES = ["LEADER", "CHARACTER", "EVENT", "STAGE"] as const;
export const COLORS = ["Red", "Green", "Blue", "Purple", "Black", "Yellow"] as const;
