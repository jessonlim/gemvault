import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export interface CardFilters {
  q?: string;
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

export async function getAllSets() {
  return db.cardSet.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
}

export const RARITIES = ["C", "UC", "R", "SR", "SEC", "L", "P"] as const;
export const CARD_TYPES = ["LEADER", "CHARACTER", "EVENT", "STAGE"] as const;
export const COLORS = ["Red", "Green", "Blue", "Purple", "Black", "Yellow"] as const;
