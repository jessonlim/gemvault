import { z } from "zod";
import { db } from "@/lib/db";
import {
  CardCondition,
  CardLanguage,
  SellMode,
  ShippingPreference,
  Prisma,
} from "@prisma/client";

export const addUserCardSchema = z.object({
  cardCode: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  condition: z.nativeEnum(CardCondition).default(CardCondition.NEAR_MINT),
  language: z.nativeEnum(CardLanguage).default(CardLanguage.EN),
  isAlternateArt: z.coerce.boolean().default(false),
  note: z.string().max(500).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

export const updateUserCardSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99).optional(),
  condition: z.nativeEnum(CardCondition).optional(),
  language: z.nativeEnum(CardLanguage).optional(),
  isAlternateArt: z.coerce.boolean().optional(),
  note: z.string().max(500).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

export const sellModeSchema = z.discriminatedUnion("sellMode", [
  z.object({ sellMode: z.literal("COLLECTION") }),
  z.object({
    sellMode: z.literal("OPEN_TO_OFFERS"),
    minimumPriceMyr: z.coerce.number().min(0.01),
    shippingPref: z.nativeEnum(ShippingPreference).default(ShippingPreference.BOTH),
    note: z.string().max(500).optional().nullable(),
  }),
  z.object({
    sellMode: z.literal("LISTED_FOR_SALE"),
    priceMyr: z.coerce.number().min(0.01),
    shippingPref: z.nativeEnum(ShippingPreference).default(ShippingPreference.BOTH),
    shippingFeeMyr: z.coerce.number().min(0).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
  }),
]);

export async function addCardToCollection(
  ownerId: string,
  input: z.infer<typeof addUserCardSchema>
) {
  const card = await db.card.findUnique({ where: { cardCode: input.cardCode } });
  if (!card) throw new Error("Card not found");

  return db.userCard.create({
    data: {
      ownerId,
      cardId: card.id,
      quantity: input.quantity,
      condition: input.condition,
      language: input.language,
      isAlternateArt: input.isAlternateArt,
      note: input.note ?? null,
      photoUrl: input.photoUrl ?? null,
    },
  });
}

export async function updateUserCard(
  userCardId: string,
  ownerId: string,
  input: z.infer<typeof updateUserCardSchema>
) {
  const owned = await db.userCard.findFirst({
    where: { id: userCardId, ownerId },
  });
  if (!owned) throw new Error("Not found");

  return db.userCard.update({
    where: { id: userCardId },
    data: input,
  });
}

export async function deleteUserCard(userCardId: string, ownerId: string) {
  const owned = await db.userCard.findFirst({ where: { id: userCardId, ownerId } });
  if (!owned) throw new Error("Not found");
  await db.userCard.delete({ where: { id: userCardId } });
}

/**
 * Atomically switch a UserCard between the three sell modes,
 * keeping SaleListing / SellPreference rows in sync.
 */
export async function setSellMode(
  userCardId: string,
  ownerId: string,
  input: z.infer<typeof sellModeSchema>
) {
  const owned = await db.userCard.findFirst({ where: { id: userCardId, ownerId } });
  if (!owned) throw new Error("Not found");

  return db.$transaction(async (tx) => {
    // Always wipe the side rows, then create whichever is needed
    await tx.saleListing.deleteMany({ where: { userCardId } });
    await tx.sellPreference.deleteMany({ where: { userCardId } });

    if (input.sellMode === "OPEN_TO_OFFERS") {
      await tx.sellPreference.create({
        data: {
          ownerId,
          userCardId,
          minimumPriceMyr: input.minimumPriceMyr,
          shippingPref: input.shippingPref,
          note: input.note ?? null,
        },
      });
    } else if (input.sellMode === "LISTED_FOR_SALE") {
      await tx.saleListing.create({
        data: {
          sellerId: ownerId,
          userCardId,
          priceMyr: input.priceMyr,
          shippingPref: input.shippingPref,
          shippingFeeMyr: input.shippingFeeMyr ?? null,
          description: input.description ?? null,
        },
      });
    }

    return tx.userCard.update({
      where: { id: userCardId },
      data: { sellMode: input.sellMode as SellMode },
    });
  });
}

export interface CollectionFilters {
  q?: string;
  sellMode?: SellMode;
  condition?: CardCondition;
}

export async function getUserCollection(
  ownerId: string,
  filters: CollectionFilters = {}
) {
  const where: Prisma.UserCardWhereInput = { ownerId };

  if (filters.sellMode) where.sellMode = filters.sellMode;
  if (filters.condition) where.condition = filters.condition;
  if (filters.q) {
    where.card = {
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { cardCode: { contains: filters.q, mode: "insensitive" } },
      ],
    };
  }

  return db.userCard.findMany({
    where,
    include: {
      card: { include: { set: { select: { code: true, name: true } } } },
      saleListing: true,
      sellPreference: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getUserCard(userCardId: string, ownerId: string) {
  return db.userCard.findFirst({
    where: { id: userCardId, ownerId },
    include: {
      card: { include: { set: true } },
      saleListing: true,
      sellPreference: true,
    },
  });
}
