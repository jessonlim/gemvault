import { Prisma, CardCondition, CardLanguage, ShippingPreference } from "@prisma/client";
import { db } from "@/lib/db";

// Condition strength: lower number = better condition.
// A buyer who accepts "GOOD" or better will accept conditions with rank <= GOOD's rank.
export const CONDITION_RANK: Record<CardCondition, number> = {
  MINT: 0,
  NEAR_MINT: 1,
  EXCELLENT: 2,
  GOOD: 3,
  PLAYED: 4,
  POOR: 5,
};

export interface ListingFilters {
  q?: string;
  setCode?: string;
  rarity?: string;
  cardType?: string;
  color?: string;
  condition?: CardCondition;
  language?: CardLanguage;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
  shippingPref?: ShippingPreference;
  page?: number;
  pageSize?: number;
}

export async function searchSaleListings(filters: ListingFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, filters.pageSize ?? 18);

  const where: Prisma.SaleListingWhereInput = { status: "ACTIVE" };

  // Price range
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.priceMyr = {
      ...(filters.minPrice != null && { gte: filters.minPrice }),
      ...(filters.maxPrice != null && { lte: filters.maxPrice }),
    };
  }

  if (filters.shippingPref) where.shippingPref = filters.shippingPref;

  // Card-level filters via the related UserCard.card
  const cardWhere: Prisma.CardWhereInput = {};
  if (filters.q) {
    cardWhere.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { cardCode: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.setCode) cardWhere.set = { code: filters.setCode };
  if (filters.rarity) cardWhere.rarity = filters.rarity;
  if (filters.cardType) cardWhere.cardType = filters.cardType;
  if (filters.color) cardWhere.colors = { has: filters.color };

  // UserCard-level filters
  const userCardWhere: Prisma.UserCardWhereInput = {};
  if (filters.condition) userCardWhere.condition = filters.condition;
  if (filters.language) userCardWhere.language = filters.language;
  if (Object.keys(cardWhere).length > 0) userCardWhere.card = cardWhere;

  if (Object.keys(userCardWhere).length > 0) where.userCard = userCardWhere;

  // Seller (city/state) filters
  const sellerWhere: Prisma.ProfileWhereInput = {};
  if (filters.city) sellerWhere.city = { equals: filters.city, mode: "insensitive" };
  if (filters.state) sellerWhere.state = { equals: filters.state, mode: "insensitive" };
  if (Object.keys(sellerWhere).length > 0) where.seller = sellerWhere;

  const [listings, total] = await Promise.all([
    db.saleListing.findMany({
      where,
      include: {
        seller: {
          select: { id: true, username: true, displayName: true, city: true, state: true, verificationStatus: true },
        },
        userCard: {
          include: { card: { include: { set: { select: { code: true, name: true } } } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.saleListing.count({ where }),
  ]);

  return {
    listings,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getListingById(id: string) {
  return db.saleListing.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          city: true,
          state: true,
          country: true,
          verificationStatus: true,
          totalSales: true,
          rating: true,
          createdAt: true,
        },
      },
      userCard: {
        include: { card: { include: { set: true } } },
      },
    },
  });
}

export async function incrementListingViews(id: string) {
  await db.saleListing.update({
    where: { id },
    data: { views: { increment: 1 } },
  });
}

// ============== Open to offers (sell preferences) ==============

export interface OffersFilters {
  q?: string;
  setCode?: string;
  rarity?: string;
  cardType?: string;
  color?: string;
  condition?: CardCondition;
  language?: CardLanguage;
  maxMinimumPrice?: number;
  city?: string;
  state?: string;
  page?: number;
  pageSize?: number;
}

export async function searchOpenToOffers(filters: OffersFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, filters.pageSize ?? 18);

  const where: Prisma.SellPreferenceWhereInput = { isActive: true };

  if (filters.maxMinimumPrice != null) {
    where.minimumPriceMyr = { lte: filters.maxMinimumPrice };
  }

  const cardWhere: Prisma.CardWhereInput = {};
  if (filters.q) {
    cardWhere.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { cardCode: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.setCode) cardWhere.set = { code: filters.setCode };
  if (filters.rarity) cardWhere.rarity = filters.rarity;
  if (filters.cardType) cardWhere.cardType = filters.cardType;
  if (filters.color) cardWhere.colors = { has: filters.color };

  const userCardWhere: Prisma.UserCardWhereInput = {};
  if (filters.condition) userCardWhere.condition = filters.condition;
  if (filters.language) userCardWhere.language = filters.language;
  if (Object.keys(cardWhere).length > 0) userCardWhere.card = cardWhere;
  if (Object.keys(userCardWhere).length > 0) where.userCard = userCardWhere;

  const sellerWhere: Prisma.ProfileWhereInput = {};
  if (filters.city) sellerWhere.city = { equals: filters.city, mode: "insensitive" };
  if (filters.state) sellerWhere.state = { equals: filters.state, mode: "insensitive" };
  if (Object.keys(sellerWhere).length > 0) where.owner = sellerWhere;

  const [items, total] = await Promise.all([
    db.sellPreference.findMany({
      where,
      include: {
        owner: {
          select: { id: true, username: true, displayName: true, city: true, state: true, verificationStatus: true },
        },
        userCard: {
          include: { card: { include: { set: { select: { code: true, name: true } } } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.sellPreference.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
