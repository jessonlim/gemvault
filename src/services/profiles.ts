import { z } from "zod";
import { db } from "@/lib/db";

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(60).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal("")),
  city: z.string().max(60).optional().nullable(),
  state: z.string().max(60).optional().nullable(),
  country: z.string().max(60).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function updateProfile(profileId: string, input: UpdateProfileInput) {
  // Normalise blanks to null so the DB doesn't store empty strings
  const data = Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k, v === "" ? null : v])
  );
  return db.profile.update({
    where: { id: profileId },
    data,
  });
}

/**
 * Public profile + counts. Returns null if username doesn't exist.
 */
export async function getPublicProfileByUsername(username: string) {
  const profile = await db.profile.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      city: true,
      state: true,
      country: true,
      role: true,
      verificationStatus: true,
      rating: true,
      totalSales: true,
      totalPurchases: true,
      createdAt: true,
    },
  });
  if (!profile) return null;

  const [activeListings, activeOffers, activeBuyRequests] = await Promise.all([
    db.saleListing.findMany({
      where: { sellerId: profile.id, status: "ACTIVE" },
      include: {
        userCard: {
          include: { card: { include: { set: { select: { code: true, name: true } } } } },
        },
        seller: {
          select: { id: true, username: true, displayName: true, city: true, state: true, verificationStatus: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 18,
    }),
    db.sellPreference.findMany({
      where: { ownerId: profile.id, isActive: true },
      include: {
        userCard: {
          include: { card: { include: { set: { select: { code: true, name: true } } } } },
        },
        owner: {
          select: { id: true, username: true, displayName: true, city: true, state: true, verificationStatus: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 18,
    }),
    db.buyRequest.findMany({
      where: { buyerId: profile.id, status: "ACTIVE" },
      include: {
        card: { include: { set: { select: { code: true, name: true } } } },
        buyer: {
          select: { id: true, username: true, displayName: true, city: true, state: true, verificationStatus: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 18,
    }),
  ]);

  return { profile, activeListings, activeOffers, activeBuyRequests };
}
