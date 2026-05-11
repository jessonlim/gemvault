import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { CardImage } from "@/components/cards/CardImage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContactButton } from "@/components/messaging/ContactButton";
import { StickyMobileBar } from "@/components/layout/StickyMobileBar";
import { MatchingBuyRequests } from "@/components/marketplace/MatchingBuyRequests";
import { findMatchingBuyRequests } from "@/services/matching";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";
import {
  formatMyr,
  CONDITION_LABELS,
  LANGUAGE_LABELS,
  SHIPPING_LABELS,
} from "@/lib/utils";
import { ShieldCheck, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OfferDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const offer = await db.sellPreference.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      userCard: { include: { card: { include: { set: true } } } },
    },
  });
  if (!offer || !offer.isActive) notFound();

  const viewer = await getCurrentProfile();
  const card = offer.userCard.card;
  const owner = offer.owner;
  const isOwner = viewer?.id === owner.id;

  const buyerMatches = isOwner
    ? await findMatchingBuyRequests({
        cardId: card.id,
        condition: offer.userCard.condition,
        askPriceMyr: offer.minimumPriceMyr,
        language: offer.userCard.language,
      })
    : [];

  return (
    <Container className="py-6 pb-32 sm:py-10 sm:pb-10">
      <Link href="/marketplace/offers" className="text-sm text-brand-400 hover:underline">
        ← Back to open-to-offers
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <CardImage src={card.imageUrl} alt={card.name} />
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
            <Badge variant="brand">{CONDITION_LABELS[offer.userCard.condition]}</Badge>
            <Badge variant="brand">{LANGUAGE_LABELS[offer.userCard.language]}</Badge>
          </div>

          <Card className="mt-5">
            <CardContent className="p-5">
              <Badge variant="warning" className="text-sm">Open to offers</Badge>
              <p className="mt-3 text-2xl font-bold text-slate-50">
                Min {formatMyr(offer.minimumPriceMyr)}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Owner accepts offers at or above this price.
                {" · "}{SHIPPING_LABELS[offer.shippingPref]}
              </p>
              {offer.note && (
                <p className="mt-4 whitespace-pre-line text-sm text-slate-300">{offer.note}</p>
              )}
              <div className="mt-5">
                <ContactButton
                  recipientUsername={owner.username}
                  isAuthed={!!viewer}
                  isOwner={isOwner}
                  label="Make an offer"
                  defaultMessage={`Hi! I'd like to make an offer on your ${card.name} (${card.cardCode}).`}
                />
                {isOwner && (
                  <Link href={`/collection/${offer.userCardId}`} className="ml-2 inline-block">
                    <span className="text-sm text-brand-400 hover:underline">Edit →</span>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="p-5">
              <Link
                href={`/profile/${owner.username}`}
                className="text-sm font-semibold text-slate-100 hover:underline"
              >
                {owner.displayName ?? owner.username}
              </Link>
              <p className="text-xs text-slate-400">@{owner.username}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                {owner.verificationStatus === "VERIFIED" && (
                  <Badge variant="success" className="gap-1">
                    <ShieldCheck size={12} /> Verified
                  </Badge>
                )}
                {owner.city && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} /> {owner.city}{owner.state ? `, ${owner.state}` : ""}
                  </div>
                )}
                <div>{owner.totalSales} sales</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isOwner && <MatchingBuyRequests requests={buyerMatches} />}

      {!isOwner && (
        <StickyMobileBar>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">{CONDITION_LABELS[offer.userCard.condition]}</p>
              <p className="text-lg font-bold text-amber-300">Min {formatMyr(offer.minimumPriceMyr)}</p>
            </div>
            <ContactButton
              recipientUsername={owner.username}
              isAuthed={!!viewer}
              isOwner={isOwner}
              label="Make an offer"
              defaultMessage={`Hi! I'd like to make an offer on your ${card.name} (${card.cardCode}).`}
            />
          </div>
        </StickyMobileBar>
      )}
    </Container>
  );
}
