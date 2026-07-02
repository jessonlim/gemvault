import { z } from "zod";
import { db } from "@/lib/db";
import { Game, OripaTier, Prisma } from "@prisma/client";

/**
 * Oripa lifecycle:
 *   DRAFT    — admin composes the prize pool; nothing visible publicly
 *   ACTIVE   — activation expands prize quantities into shuffled numbered
 *              slots; users spend credits to draw
 *   SOLD_OUT — last slot drawn (last-one prize awarded here if present)
 *   ARCHIVED — hidden from the public list
 *
 * Payment is off-platform: admins grant per-series draw credits manually
 * after receiving payment (bank transfer / TnG / cash at meetup).
 */

export const TIER_LABELS: Record<OripaTier, string> = {
  S: "S Prize",
  A: "A Prize",
  B: "B Prize",
  C: "C Prize",
  D: "D Prize",
};

export const createSeriesSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional().nullable(),
  game: z.nativeEnum(Game).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  pricePerDrawMyr: z.coerce.number().min(0.01),
});

export const addPrizeSchema = z.object({
  seriesId: z.string().min(1),
  tier: z.nativeEnum(OripaTier),
  name: z.string().min(1).max(150),
  cardCode: z.string().max(30).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(1000),
  estValueMyr: z.coerce.number().min(0).optional().nullable(),
  isLastOne: z.coerce.boolean().default(false),
});

export const grantCreditsSchema = z.object({
  seriesId: z.string().min(1),
  username: z.string().min(1),
  credits: z.coerce.number().int().min(1).max(500),
});

// ============== Admin: compose ==============

export async function createSeries(
  creatorId: string,
  input: z.infer<typeof createSeriesSchema>
) {
  return db.oripaSeries.create({
    data: {
      title: input.title,
      description: input.description || null,
      game: input.game ?? null,
      coverImageUrl: input.coverImageUrl || null,
      pricePerDrawMyr: input.pricePerDrawMyr,
      createdById: creatorId,
    },
  });
}

export async function addPrize(input: z.infer<typeof addPrizeSchema>) {
  const series = await db.oripaSeries.findUnique({ where: { id: input.seriesId } });
  if (!series) throw new Error("Series not found");
  if (series.status !== "DRAFT") throw new Error("Prizes can only be added while the series is a draft");

  let cardId: string | null = null;
  if (input.cardCode?.trim()) {
    const card = await db.card.findUnique({ where: { cardCode: input.cardCode.trim().toUpperCase() } });
    if (!card) throw new Error(`Card code "${input.cardCode}" not found in the catalog`);
    cardId = card.id;
  }

  return db.oripaPrize.create({
    data: {
      seriesId: input.seriesId,
      tier: input.tier,
      name: input.name,
      cardId,
      imageUrl: input.imageUrl || null,
      quantity: input.isLastOne ? 1 : input.quantity,
      estValueMyr: input.estValueMyr ?? null,
      isLastOne: input.isLastOne,
    },
  });
}

export async function removePrize(prizeId: string) {
  const prize = await db.oripaPrize.findUnique({
    where: { id: prizeId },
    include: { series: true },
  });
  if (!prize) throw new Error("Prize not found");
  if (prize.series.status !== "DRAFT") throw new Error("Prizes can only be removed while the series is a draft");
  await db.oripaPrize.delete({ where: { id: prizeId } });
}

/**
 * Activation: expand every non-last-one prize by its quantity, Fisher-Yates
 * shuffle, and write the pool into numbered slots. After this the pool is
 * locked — no silent restocks (a core oripa trust rule).
 */
export async function activateSeries(seriesId: string) {
  const series = await db.oripaSeries.findUnique({
    where: { id: seriesId },
    include: { prizes: true },
  });
  if (!series) throw new Error("Series not found");
  if (series.status !== "DRAFT") throw new Error("Series is already activated");

  const poolPrizes = series.prizes.filter((p) => !p.isLastOne);
  if (poolPrizes.length === 0) throw new Error("Add at least one prize before activating");

  const pool: string[] = [];
  for (const p of poolPrizes) {
    for (let i = 0; i < p.quantity; i++) pool.push(p.id);
  }
  if (pool.length < 2) throw new Error("The pool needs at least 2 packs");

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return db.$transaction(async (tx) => {
    await tx.oripaSlot.createMany({
      data: pool.map((prizeId, idx) => ({
        seriesId,
        slotNumber: idx + 1,
        prizeId,
      })),
    });
    return tx.oripaSeries.update({
      where: { id: seriesId },
      data: { status: "ACTIVE", totalSlots: pool.length, activatedAt: new Date() },
    });
  });
}

export async function archiveSeries(seriesId: string) {
  return db.oripaSeries.update({
    where: { id: seriesId },
    data: { status: "ARCHIVED" },
  });
}

// ============== Admin: credits ==============

export async function grantCredits(
  granterId: string,
  input: z.infer<typeof grantCreditsSchema>
) {
  const user = await db.profile.findUnique({
    where: { username: input.username.toLowerCase() },
  });
  if (!user) throw new Error(`User @${input.username} not found`);

  const series = await db.oripaSeries.findUnique({ where: { id: input.seriesId } });
  if (!series) throw new Error("Series not found");

  return db.oripaCredit.upsert({
    where: { seriesId_userId: { seriesId: input.seriesId, userId: user.id } },
    update: { credits: { increment: input.credits }, grantedById: granterId },
    create: {
      seriesId: input.seriesId,
      userId: user.id,
      credits: input.credits,
      grantedById: granterId,
    },
  });
}

export async function toggleSlotFulfilled(slotId: string) {
  const slot = await db.oripaSlot.findUnique({ where: { id: slotId } });
  if (!slot || !slot.drawnById) throw new Error("Slot not found or not drawn yet");
  return db.oripaSlot.update({
    where: { id: slotId },
    data: {
      fulfilled: !slot.fulfilled,
      fulfilledAt: slot.fulfilled ? null : new Date(),
    },
  });
}

// ============== Drawing ==============

export interface DrawResult {
  prize: {
    id: string;
    tier: OripaTier;
    name: string;
    imageUrl: string | null;
    estValueMyr: number | null;
  };
  slotNumber: number;
  /** Set when this draw took the final pack and a last-one prize exists */
  lastOnePrize: {
    name: string;
    imageUrl: string | null;
  } | null;
  remainingSlots: number;
}

/**
 * Race-safe draw: conditional updateMany guards both the credit balance and
 * the slot's availability inside one transaction, so double-clicks or two
 * users grabbing the same pack can never double-spend or double-assign.
 */
export async function drawSlot(
  userId: string,
  seriesId: string,
  slotNumber: number
): Promise<DrawResult> {
  return db.$transaction(async (tx) => {
    const series = await tx.oripaSeries.findUnique({ where: { id: seriesId } });
    if (!series || series.status !== "ACTIVE") {
      throw new Error("This oripa is not open for draws.");
    }

    const creditUpdate = await tx.oripaCredit.updateMany({
      where: { seriesId, userId, credits: { gte: 1 } },
      data: { credits: { decrement: 1 } },
    });
    if (creditUpdate.count === 0) {
      throw new Error("You have no draws left for this oripa. Contact the host to top up.");
    }

    const slotUpdate = await tx.oripaSlot.updateMany({
      where: { seriesId, slotNumber, drawnById: null },
      data: { drawnById: userId, drawnAt: new Date() },
    });
    if (slotUpdate.count === 0) {
      throw new Error("That pack was just taken — pick another one!");
    }

    const slot = await tx.oripaSlot.findUnique({
      where: { seriesId_slotNumber: { seriesId, slotNumber } },
      include: { prize: { include: { card: { select: { imageUrl: true } } } } },
    });
    if (!slot) throw new Error("Slot vanished mid-draw"); // unreachable

    const remainingSlots = await tx.oripaSlot.count({
      where: { seriesId, drawnById: null },
    });

    let lastOnePrize: DrawResult["lastOnePrize"] = null;
    if (remainingSlots === 0) {
      const lastOne = await tx.oripaPrize.findFirst({
        where: { seriesId, isLastOne: true },
        include: { card: { select: { imageUrl: true } } },
      });
      await tx.oripaSeries.update({
        where: { id: seriesId },
        data: {
          status: "SOLD_OUT",
          soldOutAt: new Date(),
          ...(lastOne ? { lastOneWinnerId: userId } : {}),
        },
      });
      if (lastOne) {
        lastOnePrize = {
          name: lastOne.name,
          imageUrl: lastOne.imageUrl ?? lastOne.card?.imageUrl ?? null,
        };
      }
    }

    return {
      prize: {
        id: slot.prize.id,
        tier: slot.prize.tier,
        name: slot.prize.name,
        imageUrl: slot.prize.imageUrl ?? slot.prize.card?.imageUrl ?? null,
        estValueMyr: slot.prize.estValueMyr,
      },
      slotNumber,
      lastOnePrize,
      remainingSlots,
    };
  });
}

// ============== Queries ==============

export async function listPublicSeries() {
  const series = await db.oripaSeries.findMany({
    where: { status: { in: ["ACTIVE", "SOLD_OUT"] } },
    include: {
      prizes: { where: { isLastOne: false }, orderBy: { tier: "asc" } },
      _count: { select: { slots: { where: { drawnById: null } } } },
    },
    orderBy: [{ status: "asc" }, { activatedAt: "desc" }],
  });

  return series.map((s) => ({
    ...s,
    remainingSlots: s._count.slots,
    topPrize: s.prizes[0] ?? null,
  }));
}

export interface TierSummary {
  tier: OripaTier;
  total: number;
  remaining: number;
  prizes: {
    id: string;
    name: string;
    imageUrl: string | null;
    estValueMyr: number | null;
    total: number;
    remaining: number;
  }[];
}

export async function getSeriesDetail(seriesId: string, viewerId?: string | null) {
  const series = await db.oripaSeries.findUnique({
    where: { id: seriesId },
    include: {
      createdBy: { select: { username: true, displayName: true, verificationStatus: true } },
      prizes: { include: { card: { select: { imageUrl: true, cardCode: true } } } },
      slots: {
        select: { slotNumber: true, drawnById: true, prizeId: true },
        orderBy: { slotNumber: "asc" },
      },
      lastOneWinner: { select: { username: true } },
    },
  });
  if (!series || series.status === "DRAFT" || series.status === "ARCHIVED") return null;

  // Per-prize + per-tier remaining counts (from undrawn slots)
  const remainingByPrize = new Map<string, number>();
  for (const slot of series.slots) {
    if (!slot.drawnById) {
      remainingByPrize.set(slot.prizeId, (remainingByPrize.get(slot.prizeId) ?? 0) + 1);
    }
  }

  const tierOrder: OripaTier[] = ["S", "A", "B", "C", "D"];
  const tiers: TierSummary[] = tierOrder
    .map((tier) => {
      const tierPrizes = series.prizes.filter((p) => p.tier === tier && !p.isLastOne);
      if (tierPrizes.length === 0) return null;
      const prizes = tierPrizes.map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl ?? p.card?.imageUrl ?? null,
        estValueMyr: p.estValueMyr,
        total: p.quantity,
        remaining: remainingByPrize.get(p.id) ?? 0,
      }));
      return {
        tier,
        total: prizes.reduce((a, p) => a + p.total, 0),
        remaining: prizes.reduce((a, p) => a + p.remaining, 0),
        prizes,
      };
    })
    .filter(Boolean) as TierSummary[];

  const lastOnePrize = series.prizes.find((p) => p.isLastOne) ?? null;
  const remainingSlots = series.slots.filter((s) => !s.drawnById).length;

  // Viewer-specific: credits + their pulls
  let viewerCredits = 0;
  let viewerDraws: { slotNumber: number; prizeName: string; tier: OripaTier; imageUrl: string | null; fulfilled: boolean }[] = [];
  if (viewerId) {
    const credit = await db.oripaCredit.findUnique({
      where: { seriesId_userId: { seriesId, userId: viewerId } },
    });
    viewerCredits = credit?.credits ?? 0;

    const draws = await db.oripaSlot.findMany({
      where: { seriesId, drawnById: viewerId },
      include: { prize: { include: { card: { select: { imageUrl: true } } } } },
      orderBy: { drawnAt: "desc" },
    });
    viewerDraws = draws.map((d) => ({
      slotNumber: d.slotNumber,
      prizeName: d.prize.name,
      tier: d.prize.tier,
      imageUrl: d.prize.imageUrl ?? d.prize.card?.imageUrl ?? null,
      fulfilled: d.fulfilled,
    }));
  }

  return {
    series,
    tiers,
    lastOnePrize: lastOnePrize
      ? {
          name: lastOnePrize.name,
          imageUrl: lastOnePrize.imageUrl ?? lastOnePrize.card?.imageUrl ?? null,
          estValueMyr: lastOnePrize.estValueMyr,
        }
      : null,
    remainingSlots,
    slots: series.slots.map((s) => ({ slotNumber: s.slotNumber, taken: !!s.drawnById })),
    viewerCredits,
    viewerDraws,
  };
}

// ============== Admin queries ==============

export async function listAllSeriesAdmin() {
  return db.oripaSeries.findMany({
    include: {
      _count: { select: { slots: true, prizes: true } },
      createdBy: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSeriesAdmin(seriesId: string) {
  return db.oripaSeries.findUnique({
    where: { id: seriesId },
    include: {
      prizes: {
        include: { card: { select: { imageUrl: true, cardCode: true } } },
        orderBy: [{ isLastOne: "asc" }, { tier: "asc" }, { createdAt: "asc" }],
      },
      slots: {
        where: { drawnById: { not: null } },
        include: {
          prize: { select: { name: true, tier: true } },
          drawnBy: { select: { username: true, displayName: true } },
        },
        orderBy: { drawnAt: "desc" },
      },
      credits: {
        include: { user: { select: { username: true, displayName: true } } },
        orderBy: { updatedAt: "desc" },
      },
      lastOneWinner: { select: { username: true } },
      _count: { select: { slots: true } },
    },
  });
}

export async function getMyDrawsAcrossSeries(userId: string) {
  return db.oripaSlot.findMany({
    where: { drawnById: userId },
    include: {
      prize: { include: { card: { select: { imageUrl: true } } } },
      series: { select: { id: true, title: true } },
    },
    orderBy: { drawnAt: "desc" },
    take: 50,
  });
}
