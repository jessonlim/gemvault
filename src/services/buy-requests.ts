import { z } from "zod";
import { Prisma, CardCondition, CardLanguage, ShippingPreference, BuyRequestStatus } from "@prisma/client";
import { db } from "@/lib/db";

export const createBuyRequestSchema = z.object({
  cardCode: z.string().min(1, "Card is required"),
  minCondition: z.nativeEnum(CardCondition).default(CardCondition.GOOD),
  language: z.nativeEnum(CardLanguage).optional().nullable(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  maxPriceMyr: z.coerce.number().min(0.01),
  shippingPref: z.nativeEnum(ShippingPreference).default(ShippingPreference.BOTH),
  preferredCity: z.string().max(60).optional().nullable(),
  preferredState: z.string().max(60).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export const updateBuyRequestSchema = createBuyRequestSchema.partial().extend({
  status: z.nativeEnum(BuyRequestStatus).optional(),
});

export async function createBuyRequest(
  buyerId: string,
  input: z.infer<typeof createBuyRequestSchema>
) {
  const card = await db.card.findUnique({ where: { cardCode: input.cardCode } });
  if (!card) throw new Error("Card not found");

  return db.buyRequest.create({
    data: {
      buyerId,
      cardId: card.id,
      minCondition: input.minCondition,
      language: input.language ?? null,
      quantity: input.quantity,
      maxPriceMyr: input.maxPriceMyr,
      shippingPref: input.shippingPref,
      preferredCity: input.preferredCity ?? null,
      preferredState: input.preferredState ?? null,
      note: input.note ?? null,
    },
  });
}

export async function updateBuyRequest(
  id: string,
  buyerId: string,
  input: z.infer<typeof updateBuyRequestSchema>
) {
  const owned = await db.buyRequest.findFirst({ where: { id, buyerId } });
  if (!owned) throw new Error("Not found");

  // Strip cardCode (immutable after create)
  const { cardCode: _ignore, ...rest } = input;
  return db.buyRequest.update({ where: { id }, data: rest });
}

export async function cancelBuyRequest(id: string, buyerId: string) {
  const owned = await db.buyRequest.findFirst({ where: { id, buyerId } });
  if (!owned) throw new Error("Not found");
  return db.buyRequest.update({ where: { id }, data: { status: "CANCELLED" } });
}

export async function getBuyRequestById(id: string) {
  return db.buyRequest.findUnique({
    where: { id },
    include: {
      buyer: {
        select: {
          id: true,
          username: true,
          displayName: true,
          city: true,
          state: true,
          country: true,
          verificationStatus: true,
          totalPurchases: true,
          rating: true,
          createdAt: true,
        },
      },
      card: { include: { set: true } },
    },
  });
}

export async function listMyBuyRequests(buyerId: string) {
  return db.buyRequest.findMany({
    where: { buyerId },
    include: { card: { include: { set: { select: { code: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export interface BuyRequestFilters {
  q?: string;
  setCode?: string;
  rarity?: string;
  cardType?: string;
  color?: string;
  minMaxPrice?: number;
  language?: CardLanguage;
  city?: string;
  state?: string;
  page?: number;
  pageSize?: number;
}

export async function searchBuyRequests(filters: BuyRequestFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, filters.pageSize ?? 18);

  const where: Prisma.BuyRequestWhereInput = { status: "ACTIVE" };

  if (filters.minMaxPrice != null) where.maxPriceMyr = { gte: filters.minMaxPrice };
  if (filters.language) where.language = filters.language;
  if (filters.city) where.preferredCity = { equals: filters.city, mode: "insensitive" };
  if (filters.state) where.preferredState = { equals: filters.state, mode: "insensitive" };

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
  if (Object.keys(cardWhere).length > 0) where.card = cardWhere;

  const [requests, total] = await Promise.all([
    db.buyRequest.findMany({
      where,
      include: {
        buyer: { select: { id: true, username: true, displayName: true, city: true, state: true, verificationStatus: true } },
        card: { include: { set: { select: { code: true, name: true } } } },
      },
      orderBy: [{ maxPriceMyr: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.buyRequest.count({ where }),
  ]);

  return {
    requests,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
