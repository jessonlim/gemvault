import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { CONDITION_RANK } from "./marketplace";

/**
 * Matching engine — keep simple and deterministic.
 *
 * "Condition acceptable" means the seller's card condition is at least as good
 * as the buyer's minCondition (lower numeric rank = better).
 *
 * "Match score" = how good a deal it is. 100 = perfect, lower = worse.
 *   - If seller's ask ≤ buyer's max: 100 minus a small penalty if buyer is overpaying their target
 *   - If seller's ask > buyer's max: 100 - (gap %) capped at 0
 */

const CONDITION_ORDER = ["MINT", "NEAR_MINT", "EXCELLENT", "GOOD", "PLAYED", "POOR"] as const;

function conditionsAtOrAbove(min: keyof typeof CONDITION_RANK) {
  const rank = CONDITION_RANK[min];
  return CONDITION_ORDER.filter((c) => CONDITION_RANK[c] <= rank);
}

/**
 * Compute match score (0-100). Inputs in MYR.
 */
export function matchScore(askPrice: number, maxBudget: number): number {
  if (askPrice <= maxBudget) {
    // Buyer's max ≥ seller ask = full match (the deal works financially)
    return 100;
  }
  // Seller asking above buyer's max — score by how big the gap is
  const gap = (askPrice - maxBudget) / maxBudget;
  return Math.max(0, Math.round((1 - gap) * 100));
}

/**
 * Bucket a match score into the three tiers shown on the Matches page.
 */
export function matchTier(score: number): "perfect" | "near" | "potential" {
  if (score >= 95) return "perfect";
  if (score >= 80) return "near";
  return "potential";
}

// ============== For a buy request ==============

interface BuyRequestMatchInput {
  cardId: string;
  minCondition: keyof typeof CONDITION_RANK;
  maxPriceMyr: number;
  language?: string | null;
  preferredCity?: string | null;
  preferredState?: string | null;
}

export async function findMatchingListings(input: BuyRequestMatchInput, take = 12) {
  const acceptableConditions = conditionsAtOrAbove(input.minCondition);

  return db.saleListing.findMany({
    where: {
      status: "ACTIVE",
      priceMyr: { lte: input.maxPriceMyr },
      userCard: {
        cardId: input.cardId,
        condition: { in: acceptableConditions as Prisma.EnumCardConditionFilter["in"] },
        ...(input.language ? { language: input.language as Prisma.EnumCardLanguageFilter["equals"] } : {}),
      },
    },
    include: {
      seller: {
        select: { id: true, username: true, displayName: true, city: true, state: true, verificationStatus: true },
      },
      userCard: {
        include: { card: { include: { set: { select: { code: true, name: true } } } } },
      },
    },
    orderBy: [{ priceMyr: "asc" }, { createdAt: "desc" }],
    take,
  });
}

export async function findMatchingOffers(input: BuyRequestMatchInput, take = 12) {
  const acceptableConditions = conditionsAtOrAbove(input.minCondition);

  return db.sellPreference.findMany({
    where: {
      isActive: true,
      minimumPriceMyr: { lte: input.maxPriceMyr },
      userCard: {
        cardId: input.cardId,
        condition: { in: acceptableConditions as Prisma.EnumCardConditionFilter["in"] },
        ...(input.language ? { language: input.language as Prisma.EnumCardLanguageFilter["equals"] } : {}),
      },
    },
    include: {
      owner: {
        select: { id: true, username: true, displayName: true, city: true, state: true, verificationStatus: true },
      },
      userCard: {
        include: { card: { include: { set: { select: { code: true, name: true } } } } },
      },
    },
    orderBy: [{ minimumPriceMyr: "asc" }, { createdAt: "desc" }],
    take,
  });
}

// ============== For a listing or open-to-offers card ==============

interface SupplyMatchInput {
  cardId: string;
  condition: keyof typeof CONDITION_RANK;
  askPriceMyr: number;
  language?: string | null;
}

export async function findMatchingBuyRequests(input: SupplyMatchInput, take = 12) {
  const cardConditionRank = CONDITION_RANK[input.condition];

  const acceptableForBuyer = CONDITION_ORDER.filter(
    (c) => CONDITION_RANK[c] >= cardConditionRank
  );

  return db.buyRequest.findMany({
    where: {
      status: "ACTIVE",
      cardId: input.cardId,
      maxPriceMyr: { gte: input.askPriceMyr },
      minCondition: { in: acceptableForBuyer as Prisma.EnumCardConditionFilter["in"] },
      ...(input.language ? { OR: [{ language: null }, { language: input.language as Prisma.EnumCardLanguageFilter["equals"] }] } : {}),
    },
    include: {
      buyer: {
        select: { id: true, username: true, displayName: true, city: true, state: true, verificationStatus: true },
      },
      card: { include: { set: { select: { code: true, name: true } } } },
    },
    orderBy: [{ maxPriceMyr: "desc" }, { createdAt: "desc" }],
    take,
  });
}

// ============== Profile-wide matches dashboard ==============

export interface ProfileMatch {
  id: string;
  /** Where the match originated */
  source: "buy_request" | "listing" | "offer";
  sourceId: string;
  card: { id: string; cardCode: string; name: string; imageUrl: string | null; setCode: string };
  /** The other party */
  counterparty: { username: string; displayName: string | null; city: string | null; verified: boolean };
  /** Buyer's max budget (for buyer-side matches) or counterparty's max (for seller-side) */
  buyerMax: number;
  /** Seller's asking price */
  sellerAsk: number;
  /** Direction of the deal from current user's POV */
  direction: "buying" | "selling";
  /** Match score 0-100 */
  score: number;
  /** Match tier */
  tier: "perfect" | "near" | "potential";
  /** Optional: link target on the listing/offer/request */
  href: string;
  /** Optional: which condition the card is in */
  condition?: string;
}

/**
 * Aggregate all matches for the user across both sides of the market.
 * As a buyer: their active buy requests → matching listings & offers
 * As a seller: their active listings & offers → matching buy requests
 */
export async function getProfileMatches(profileId: string): Promise<ProfileMatch[]> {
  // --- BUYER SIDE: my buy requests → matching supply ---
  const myBuyRequests = await db.buyRequest.findMany({
    where: { buyerId: profileId, status: "ACTIVE" },
  });

  const buyerSideMatches: ProfileMatch[] = [];
  for (const br of myBuyRequests) {
    const [listings, offers] = await Promise.all([
      findMatchingListings(
        {
          cardId: br.cardId,
          minCondition: br.minCondition,
          maxPriceMyr: br.maxPriceMyr,
          language: br.language,
        },
        20
      ),
      findMatchingOffers(
        {
          cardId: br.cardId,
          minCondition: br.minCondition,
          maxPriceMyr: br.maxPriceMyr,
          language: br.language,
        },
        20
      ),
    ]);

    for (const l of listings) {
      const score = matchScore(l.priceMyr, br.maxPriceMyr);
      buyerSideMatches.push({
        id: `bl_${br.id}_${l.id}`,
        source: "buy_request",
        sourceId: br.id,
        card: {
          id: l.userCard.card.id,
          cardCode: l.userCard.card.cardCode,
          name: l.userCard.card.name,
          imageUrl: l.userCard.card.imageUrl,
          setCode: l.userCard.card.set.code,
        },
        counterparty: {
          username: l.seller.username,
          displayName: l.seller.displayName,
          city: l.seller.city,
          verified: l.seller.verificationStatus === "VERIFIED",
        },
        buyerMax: br.maxPriceMyr,
        sellerAsk: l.priceMyr,
        direction: "buying",
        score,
        tier: matchTier(score),
        href: `/marketplace/${l.id}`,
        condition: l.userCard.condition,
      });
    }

    for (const o of offers) {
      const score = matchScore(o.minimumPriceMyr, br.maxPriceMyr);
      buyerSideMatches.push({
        id: `bo_${br.id}_${o.id}`,
        source: "buy_request",
        sourceId: br.id,
        card: {
          id: o.userCard.card.id,
          cardCode: o.userCard.card.cardCode,
          name: o.userCard.card.name,
          imageUrl: o.userCard.card.imageUrl,
          setCode: o.userCard.card.set.code,
        },
        counterparty: {
          username: o.owner.username,
          displayName: o.owner.displayName,
          city: o.owner.city,
          verified: o.owner.verificationStatus === "VERIFIED",
        },
        buyerMax: br.maxPriceMyr,
        sellerAsk: o.minimumPriceMyr,
        direction: "buying",
        score,
        tier: matchTier(score),
        href: `/marketplace/offers/${o.id}`,
        condition: o.userCard.condition,
      });
    }
  }

  // --- SELLER SIDE: my listings & offers → matching buy requests ---
  const [myListings, myOffers] = await Promise.all([
    db.saleListing.findMany({
      where: { sellerId: profileId, status: "ACTIVE" },
      include: { userCard: { include: { card: { include: { set: { select: { code: true } } } } } } },
    }),
    db.sellPreference.findMany({
      where: { ownerId: profileId, isActive: true },
      include: { userCard: { include: { card: { include: { set: { select: { code: true } } } } } } },
    }),
  ]);

  const sellerSideMatches: ProfileMatch[] = [];

  for (const l of myListings) {
    const buyers = await findMatchingBuyRequests(
      {
        cardId: l.userCard.cardId,
        condition: l.userCard.condition,
        askPriceMyr: l.priceMyr,
        language: l.userCard.language,
      },
      20
    );
    for (const b of buyers) {
      const score = matchScore(l.priceMyr, b.maxPriceMyr);
      sellerSideMatches.push({
        id: `sl_${l.id}_${b.id}`,
        source: "listing",
        sourceId: l.id,
        card: {
          id: l.userCard.cardId,
          cardCode: l.userCard.card.cardCode,
          name: l.userCard.card.name,
          imageUrl: l.userCard.card.imageUrl,
          setCode: l.userCard.card.set.code,
        },
        counterparty: {
          username: b.buyer.username,
          displayName: b.buyer.displayName,
          city: b.buyer.city,
          verified: b.buyer.verificationStatus === "VERIFIED",
        },
        buyerMax: b.maxPriceMyr,
        sellerAsk: l.priceMyr,
        direction: "selling",
        score,
        tier: matchTier(score),
        href: `/buy-requests/${b.id}`,
        condition: l.userCard.condition,
      });
    }
  }

  for (const o of myOffers) {
    const buyers = await findMatchingBuyRequests(
      {
        cardId: o.userCard.cardId,
        condition: o.userCard.condition,
        askPriceMyr: o.minimumPriceMyr,
        language: o.userCard.language,
      },
      20
    );
    for (const b of buyers) {
      const score = matchScore(o.minimumPriceMyr, b.maxPriceMyr);
      sellerSideMatches.push({
        id: `so_${o.id}_${b.id}`,
        source: "offer",
        sourceId: o.id,
        card: {
          id: o.userCard.cardId,
          cardCode: o.userCard.card.cardCode,
          name: o.userCard.card.name,
          imageUrl: o.userCard.card.imageUrl,
          setCode: o.userCard.card.set.code,
        },
        counterparty: {
          username: b.buyer.username,
          displayName: b.buyer.displayName,
          city: b.buyer.city,
          verified: b.buyer.verificationStatus === "VERIFIED",
        },
        buyerMax: b.maxPriceMyr,
        sellerAsk: o.minimumPriceMyr,
        direction: "selling",
        score,
        tier: matchTier(score),
        href: `/buy-requests/${b.id}`,
        condition: o.userCard.condition,
      });
    }
  }

  // Combine and sort by score desc, then by recency in card name
  const all = [...buyerSideMatches, ...sellerSideMatches];
  all.sort((a, b) => b.score - a.score);
  return all;
}
