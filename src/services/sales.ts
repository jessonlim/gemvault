import { z } from "zod";
import { db } from "@/lib/db";
import type { Sale } from "@prisma/client";

/**
 * Sale lifecycle:
 *   Seller marks sold → status = PENDING_BUYER_CONFIRM
 *   Buyer confirms     → status = CONFIRMED (listing → SOLD, UserCard removed, totals++)
 *   Buyer disputes     → status = DISPUTED
 *   Either cancels     → status = CANCELLED (listing → ACTIVE again)
 */

export const markSoldSchema = z.object({
  /** Which UserCard is being sold (must belong to current user) */
  userCardId: z.string().min(1),
  /** Buyer's username (must exist + not be self) */
  buyerUsername: z.string().min(1),
  /** Final negotiated price */
  finalPriceMyr: z.coerce.number().min(0.01),
  /** Optional seller's note */
  sellerNote: z.string().max(500).optional().nullable(),
});

export type MarkSoldInput = z.infer<typeof markSoldSchema>;

/**
 * Create a PENDING_BUYER_CONFIRM sale. Sets the listing to RESERVED so it stops
 * appearing in marketplace search until the buyer confirms (or cancels).
 */
export async function markSold(sellerId: string, input: MarkSoldInput) {
  const userCard = await db.userCard.findFirst({
    where: { id: input.userCardId, ownerId: sellerId },
    include: { saleListing: true, sellPreference: true },
  });
  if (!userCard) throw new Error("Card not found in your collection");

  const buyer = await db.profile.findUnique({
    where: { username: input.buyerUsername.toLowerCase() },
  });
  if (!buyer) throw new Error("Buyer username not found");
  if (buyer.id === sellerId) throw new Error("You can't sell to yourself");

  // Make sure there isn't already a pending sale for this UserCard
  const existing = await db.sale.findFirst({
    where: {
      sellerId,
      cardId: userCard.cardId,
      status: "PENDING_BUYER_CONFIRM",
      // Match by the (now-snapshot) attributes that identify this exact card
      condition: userCard.condition,
      language: userCard.language,
    },
  });
  if (existing) {
    throw new Error(
      "There's already a pending sale for this card waiting on a buyer to confirm."
    );
  }

  return db.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        sellerId,
        buyerId: buyer.id,
        cardId: userCard.cardId,
        condition: userCard.condition,
        language: userCard.language,
        isAlternateArt: userCard.isAlternateArt,
        finalPriceMyr: input.finalPriceMyr,
        saleListingId: userCard.saleListing?.id ?? null,
        sellerNote: input.sellerNote ?? null,
      },
    });

    // Pause the listing (if any) so it stops showing in marketplace
    if (userCard.saleListing) {
      await tx.saleListing.update({
        where: { id: userCard.saleListing.id },
        data: { status: "RESERVED" },
      });
    }

    return sale;
  });
}

/**
 * Buyer confirms a pending sale. Completes the transaction:
 *   - Listing (if any) → SOLD
 *   - UserCard removed from seller's collection
 *   - seller.totalSales++, buyer.totalPurchases++
 */
export async function confirmSale(saleId: string, buyerId: string): Promise<Sale> {
  const sale = await db.sale.findFirst({
    where: { id: saleId, buyerId, status: "PENDING_BUYER_CONFIRM" },
    include: { saleListing: true },
  });
  if (!sale) throw new Error("Sale not found or already resolved");

  return db.$transaction(async (tx) => {
    // 1. Mark sale CONFIRMED
    const confirmed = await tx.sale.update({
      where: { id: saleId },
      data: { status: "CONFIRMED", buyerConfirmedAt: new Date() },
    });

    // 2. Resolve the listing → SOLD
    if (sale.saleListingId) {
      const listing = await tx.saleListing.findUnique({
        where: { id: sale.saleListingId },
      });
      if (listing) {
        await tx.saleListing.update({
          where: { id: sale.saleListingId },
          data: { status: "SOLD", soldAt: new Date() },
        });
        // Remove the UserCard the listing referenced
        const userCard = await tx.userCard.findUnique({
          where: { id: listing.userCardId },
        });
        if (userCard) {
          if (userCard.quantity > 1) {
            await tx.userCard.update({
              where: { id: userCard.id },
              data: { quantity: userCard.quantity - 1, sellMode: "COLLECTION" },
            });
          } else {
            // Cascades will clean up SellPreference if any
            await tx.userCard.delete({ where: { id: userCard.id } });
          }
        }
      }
    }

    // 3. Bump counters
    await tx.profile.update({
      where: { id: sale.sellerId },
      data: { totalSales: { increment: 1 } },
    });
    await tx.profile.update({
      where: { id: sale.buyerId },
      data: { totalPurchases: { increment: 1 } },
    });

    return confirmed;
  });
}

export async function disputeSale(saleId: string, buyerId: string, note?: string) {
  const sale = await db.sale.findFirst({
    where: { id: saleId, buyerId, status: "PENDING_BUYER_CONFIRM" },
  });
  if (!sale) throw new Error("Sale not found or already resolved");

  return db.sale.update({
    where: { id: saleId },
    data: {
      status: "DISPUTED",
      disputedAt: new Date(),
      buyerDisputeNote: note?.trim() || null,
    },
  });
}

export async function cancelSale(saleId: string, profileId: string) {
  const sale = await db.sale.findFirst({
    where: {
      id: saleId,
      OR: [{ sellerId: profileId }, { buyerId: profileId }],
      status: "PENDING_BUYER_CONFIRM",
    },
    include: { saleListing: true },
  });
  if (!sale) throw new Error("Sale not found or already resolved");

  return db.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id: saleId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    // Reactivate the listing
    if (sale.saleListing && sale.saleListing.status === "RESERVED") {
      await tx.saleListing.update({
        where: { id: sale.saleListing.id },
        data: { status: "ACTIVE" },
      });
    }
  });
}

// ============== Queries ==============

export async function listMySales(profileId: string) {
  return db.sale.findMany({
    where: { OR: [{ sellerId: profileId }, { buyerId: profileId }] },
    include: {
      seller: { select: { username: true, displayName: true, avatarUrl: true } },
      buyer: { select: { username: true, displayName: true, avatarUrl: true } },
      card: { include: { set: { select: { code: true, name: true } } } },
      ratings: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSaleForUser(saleId: string, profileId: string) {
  return db.sale.findFirst({
    where: {
      id: saleId,
      OR: [{ sellerId: profileId }, { buyerId: profileId }],
    },
    include: {
      seller: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      buyer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      card: { include: { set: true } },
      saleListing: true,
      ratings: true,
    },
  });
}

/**
 * Recent CONFIRMED sales for a given card — used for the
 * "Recent GemVault sales" stat on the card detail page.
 */
export async function getRecentSalesForCard(cardId: string, limit = 10) {
  const sales = await db.sale.findMany({
    where: { cardId, status: "CONFIRMED" },
    orderBy: { buyerConfirmedAt: "desc" },
    take: limit,
    select: {
      id: true,
      finalPriceMyr: true,
      condition: true,
      language: true,
      buyerConfirmedAt: true,
    },
  });

  const prices = sales.map((s) => s.finalPriceMyr);
  const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  const min = prices.length > 0 ? Math.min(...prices) : null;
  const max = prices.length > 0 ? Math.max(...prices) : null;
  const last = sales[0]?.finalPriceMyr ?? null;
  const lastAt = sales[0]?.buyerConfirmedAt ?? null;

  return {
    sales,
    stats: { count: sales.length, avg, min, max, last, lastAt },
  };
}

export async function getPendingSalesForUser(profileId: string) {
  return db.sale.findMany({
    where: {
      OR: [{ sellerId: profileId }, { buyerId: profileId }],
      status: "PENDING_BUYER_CONFIRM",
    },
    include: {
      seller: { select: { username: true, displayName: true } },
      buyer: { select: { username: true, displayName: true } },
      card: { select: { name: true, cardCode: true, imageUrl: true } },
    },
    orderBy: { sellerMarkedAt: "desc" },
  });
}
