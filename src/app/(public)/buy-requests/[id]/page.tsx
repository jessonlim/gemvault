import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { CardImage } from "@/components/cards/CardImage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContactButton } from "@/components/messaging/ContactButton";
import { StickyMobileBar } from "@/components/layout/StickyMobileBar";
import { ListingItem } from "@/components/marketplace/ListingItem";
import { OfferItem } from "@/components/marketplace/OfferItem";
import { CancelBuyRequestButton } from "./cancel-button";
import { getBuyRequestById } from "@/services/buy-requests";
import { findMatchingListings, findMatchingOffers } from "@/services/matching";
import { getCurrentProfile } from "@/lib/auth";
import {
  formatMyr,
  formatDate,
  CONDITION_LABELS,
  LANGUAGE_LABELS,
  SHIPPING_LABELS,
  timeAgo,
} from "@/lib/utils";
import { ShieldCheck, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BuyRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [request, viewer] = await Promise.all([
    getBuyRequestById(params.id),
    getCurrentProfile(),
  ]);
  if (!request) notFound();

  const card = request.card;
  const buyer = request.buyer;
  const isOwner = viewer?.id === buyer.id;

  const [matchingListings, matchingOffers] = await Promise.all([
    findMatchingListings({
      cardId: card.id,
      minCondition: request.minCondition,
      maxPriceMyr: request.maxPriceMyr,
      language: request.language,
    }),
    findMatchingOffers({
      cardId: card.id,
      minCondition: request.minCondition,
      maxPriceMyr: request.maxPriceMyr,
      language: request.language,
    }),
  ]);

  return (
    <Container className="py-6 pb-32 sm:py-10 sm:pb-10">
      <Link href="/buy-requests" className="text-sm text-brand-400 hover:underline">
        ← Back to buy requests
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <CardImage src={card.imageUrl} alt={card.name} />
        </div>

        <div className="min-w-0">
          <Link href={`/cards/${card.cardCode}`} className="text-xs text-slate-500 hover:underline">
            {card.cardCode} · {card.set.name}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
            Wanted: {card.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">
            {request.status !== "ACTIVE" && <Badge variant="danger">{request.status}</Badge>}
            <Badge variant="outline">Min {CONDITION_LABELS[request.minCondition]}</Badge>
            {request.language && <Badge variant="outline">{LANGUAGE_LABELS[request.language]}</Badge>}
            {request.quantity > 1 && <Badge>×{request.quantity}</Badge>}
            <Badge>{SHIPPING_LABELS[request.shippingPref]}</Badge>
          </div>

          <Card className="mt-5">
            <CardContent className="p-5">
              <p className="text-sm text-slate-400">Willing to pay up to</p>
              <p className="text-3xl font-bold text-emerald-300">{formatMyr(request.maxPriceMyr)}</p>
              {request.note && (
                <p className="mt-3 whitespace-pre-line text-sm text-slate-300">{request.note}</p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {!isOwner && request.status === "ACTIVE" && (
                  <ContactButton
                    recipientUsername={buyer.username}
                    isAuthed={!!viewer}
                    label="I have this card"
                    defaultMessage={`Hi! I have ${card.name} (${card.cardCode}) for sale and saw your buy request.`}
                  />
                )}
                {isOwner && request.status === "ACTIVE" && (
                  <CancelBuyRequestButton id={request.id} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="p-5">
              <Link
                href={`/profile/${buyer.username}`}
                className="text-sm font-semibold text-slate-100 hover:underline"
              >
                {buyer.displayName ?? buyer.username}
              </Link>
              <p className="text-xs text-slate-400">@{buyer.username}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                {buyer.verificationStatus === "VERIFIED" && (
                  <Badge variant="success" className="gap-1">
                    <ShieldCheck size={12} /> Verified
                  </Badge>
                )}
                {(request.preferredCity || buyer.city) && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    {request.preferredCity ?? buyer.city}
                    {request.preferredState ?? buyer.state ? `, ${request.preferredState ?? buyer.state}` : ""}
                  </div>
                )}
                <div>{buyer.totalPurchases} purchases</div>
                <div>· Posted {timeAgo(request.createdAt)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Matches — only show to the buyer */}
      {isOwner && (
        <>
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-100">Matching listings</h2>
            <p className="text-sm text-slate-400">
              Active sale listings at or below your max price.
            </p>
            {matchingListings.length === 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
                No matching listings yet. We&apos;ll keep looking — sellers can find your request from the public list.
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {matchingListings.map((l) => <ListingItem key={l.id} listing={l} />)}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-100">Owners open to offers</h2>
            <p className="text-sm text-slate-400">
              Collectors who own this card and would accept an offer at or below your max.
            </p>
            {matchingOffers.length === 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
                No matching offers yet.
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {matchingOffers.map((o) => <OfferItem key={o.id} offer={o} />)}
              </div>
            )}
          </section>
        </>
      )}

      {/* Sticky mobile CTA */}
      {!isOwner && request.status === "ACTIVE" && (
        <StickyMobileBar>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">Min {CONDITION_LABELS[request.minCondition]}</p>
              <p className="text-lg font-bold text-emerald-300">Up to {formatMyr(request.maxPriceMyr)}</p>
            </div>
            <ContactButton
              recipientUsername={buyer.username}
              isAuthed={!!viewer}
              label="I have this"
              defaultMessage={`Hi! I have ${card.name} (${card.cardCode}) for sale and saw your buy request.`}
            />
          </div>
        </StickyMobileBar>
      )}
    </Container>
  );
}
