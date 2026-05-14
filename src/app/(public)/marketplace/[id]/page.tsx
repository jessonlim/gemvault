import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { CardImage } from "@/components/cards/CardImage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContactButton } from "@/components/messaging/ContactButton";
import { StickyMobileBar } from "@/components/layout/StickyMobileBar";
import { MarkSoldDialog } from "@/components/sales/MarkSoldDialog";
import { getListingById, incrementListingViews } from "@/services/marketplace";
import { findMatchingBuyRequests } from "@/services/matching";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { MatchingBuyRequests } from "@/components/marketplace/MatchingBuyRequests";
import {
  formatMyr,
  formatDate,
  CONDITION_LABELS,
  LANGUAGE_LABELS,
  SHIPPING_LABELS,
} from "@/lib/utils";
import { ShieldCheck, MapPin, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [listing, viewer] = await Promise.all([
    getListingById(params.id),
    getCurrentProfile(),
  ]);
  if (!listing) notFound();

  // Don't count seller's own views
  if (!viewer || viewer.id !== listing.sellerId) {
    void incrementListingViews(listing.id);
  }

  const card = listing.userCard.card;
  const seller = listing.seller;
  const isOwner = viewer?.id === seller.id;

  // For the seller (owner), surface buy requests + buyer suggestions for Mark Sold
  const [buyerMatches, buyerSuggestions] = isOwner
    ? await Promise.all([
        findMatchingBuyRequests({
          cardId: card.id,
          condition: listing.userCard.condition,
          askPriceMyr: listing.priceMyr,
          language: listing.userCard.language,
        }),
        db.conversation.findMany({
          where: { saleListingId: listing.id, sellerId: seller.id },
          include: { buyer: { select: { username: true, displayName: true } } },
          orderBy: { lastMessageAt: "desc" },
          take: 8,
        }),
      ])
    : [[], []];

  return (
    <Container className="py-6 pb-32 sm:py-10 sm:pb-10">
      <Link href="/marketplace" className="text-sm text-brand-400 hover:underline">
        ← Back to marketplace
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <CardImage src={card.imageUrl} alt={card.name} />
          <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500">
            <Eye size={12} /> {listing.views} views
          </p>
        </div>

        <div className="min-w-0">
          <Link href={`/cards/${card.cardCode}`} className="text-xs text-slate-500 hover:underline">
            {card.cardCode} · {card.set.name}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">{card.name}</h1>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{card.rarity}</Badge>
            <Badge>{card.cardType}</Badge>
            {card.colors.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}
            <Badge variant="brand">{CONDITION_LABELS[listing.userCard.condition]}</Badge>
            <Badge variant="brand">{LANGUAGE_LABELS[listing.userCard.language]}</Badge>
            {listing.userCard.isAlternateArt && <Badge variant="warning">Alt Art</Badge>}
          </div>

          <Card className="mt-5">
            <CardContent className="p-5">
              <p className="text-3xl font-bold text-slate-50">{formatMyr(listing.priceMyr)}</p>
              <p className="mt-1 text-sm text-slate-400">
                {SHIPPING_LABELS[listing.shippingPref]}
                {listing.shippingFeeMyr != null && listing.shippingPref !== "MEETUP_ONLY" &&
                  ` · ${formatMyr(listing.shippingFeeMyr)} shipping`}
              </p>
              {listing.description && (
                <p className="mt-4 whitespace-pre-line text-sm text-slate-300">
                  {listing.description}
                </p>
              )}
              <div className="mt-5">
                <ContactButton
                  recipientUsername={seller.username}
                  saleListingId={listing.id}
                  isAuthed={!!viewer}
                  isOwner={isOwner}
                  label="Contact seller"
                  defaultMessage={`Hi! I'm interested in your listing for ${card.name} (${card.cardCode}).`}
                />
              </div>
              {isOwner && listing.status === "ACTIVE" && (
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
                  <MarkSoldDialog
                    userCardId={listing.userCardId}
                    defaultPrice={listing.priceMyr}
                    buyerSuggestions={buyerSuggestions.map((c) => c.buyer)}
                  />
                  <Link href={`/collection/${listing.userCardId}`}>
                    <span className="text-sm text-brand-400 hover:underline">Edit listing →</span>
                  </Link>
                </div>
              )}
              {isOwner && listing.status === "RESERVED" && (
                <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-900/10 p-3 text-xs text-amber-300">
                  Sale marked — waiting for buyer to confirm. View progress in{" "}
                  <Link href="/sales" className="font-semibold underline">Sales</Link>.
                </div>
              )}
              {isOwner && listing.status === "SOLD" && (
                <div className="mt-3 rounded-lg border border-success-500/30 bg-emerald-900/10 p-3 text-xs text-emerald-300">
                  This listing is sold. 🎉
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seller card */}
          <Card className="mt-4">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/profile/${seller.username}`}
                    className="text-sm font-semibold text-slate-100 hover:underline"
                  >
                    {seller.displayName ?? seller.username}
                  </Link>
                  <p className="text-xs text-slate-400">@{seller.username}</p>
                </div>
                {seller.verificationStatus === "VERIFIED" && (
                  <Badge variant="success" className="gap-1">
                    <ShieldCheck size={12} /> Verified
                  </Badge>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-400">
                {seller.city && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} /> {seller.city}{seller.state ? `, ${seller.state}` : ""}
                  </div>
                )}
                <div>
                  Joined {formatDate(seller.createdAt)}
                </div>
                <div>{seller.totalSales} sales</div>
                {seller.rating != null && <div>★ {seller.rating.toFixed(1)}</div>}
              </div>
              {seller.bio && <p className="mt-3 text-sm text-slate-300">{seller.bio}</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {isOwner && <MatchingBuyRequests requests={buyerMatches} />}

      {/* Sticky mobile CTA */}
      {!isOwner && (
        <StickyMobileBar>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">{CONDITION_LABELS[listing.userCard.condition]}</p>
              <p className="text-lg font-bold text-slate-50">{formatMyr(listing.priceMyr)}</p>
            </div>
            <ContactButton
              recipientUsername={seller.username}
              saleListingId={listing.id}
              isAuthed={!!viewer}
              isOwner={isOwner}
              label="Contact seller"
              defaultMessage={`Hi! I'm interested in your listing for ${card.name} (${card.cardCode}).`}
            />
          </div>
        </StickyMobileBar>
      )}
    </Container>
  );
}
