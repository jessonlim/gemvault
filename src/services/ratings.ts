import { z } from "zod";
import { db } from "@/lib/db";

export const submitRatingSchema = z.object({
  saleId: z.string().min(1),
  stars: z.coerce.number().int().min(1).max(5),
  review: z.string().max(500).optional().nullable(),
});

export type SubmitRatingInput = z.infer<typeof submitRatingSchema>;

/**
 * Submit a rating for the other party in a CONFIRMED sale.
 * Refreshes the receiver's rolling average in Profile.rating.
 */
export async function submitRating(raterId: string, input: SubmitRatingInput) {
  const sale = await db.sale.findFirst({
    where: {
      id: input.saleId,
      status: "CONFIRMED",
      OR: [{ sellerId: raterId }, { buyerId: raterId }],
    },
  });
  if (!sale) throw new Error("Sale not found or not eligible for rating");

  const ratedId = sale.sellerId === raterId ? sale.buyerId : sale.sellerId;

  // Already rated this sale?
  const existing = await db.saleRating.findUnique({
    where: { saleId_raterId: { saleId: input.saleId, raterId } },
  });
  if (existing) throw new Error("You've already rated this sale");

  await db.$transaction(async (tx) => {
    await tx.saleRating.create({
      data: {
        saleId: input.saleId,
        raterId,
        ratedId,
        stars: input.stars,
        review: input.review?.trim() || null,
      },
    });

    // Recompute the rated user's rolling average
    const allRatings = await tx.saleRating.findMany({
      where: { ratedId },
      select: { stars: true },
    });
    const avg =
      allRatings.length > 0
        ? allRatings.reduce((acc, r) => acc + r.stars, 0) / allRatings.length
        : null;

    await tx.profile.update({
      where: { id: ratedId },
      data: { rating: avg },
    });
  });
}

export async function getRatingsForUser(profileId: string, limit = 10) {
  return db.saleRating.findMany({
    where: { ratedId: profileId },
    include: {
      rater: { select: { username: true, displayName: true, avatarUrl: true } },
      sale: {
        include: {
          card: { select: { name: true, cardCode: true, imageUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getRatingForSale(saleId: string, raterId: string) {
  return db.saleRating.findUnique({
    where: { saleId_raterId: { saleId, raterId } },
  });
}
