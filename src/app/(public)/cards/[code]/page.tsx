import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { CardImage } from "@/components/cards/CardImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { StickyMobileBar } from "@/components/layout/StickyMobileBar";
import { getCardByCode } from "@/services/cards";
import { db } from "@/lib/db";
import { formatMyr, CONDITION_LABELS, LANGUAGE_LABELS } from "@/lib/utils";
import { Flame, Plus, Heart, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CardDetailPage({
  params,
}: {
  params: { code: string };
}) {
  const code = decodeURIComponent(params.code);
  const card = await getCardByCode(code);
  if (!card) notFound();

  const [activeListings, buyRequests] = await Promise.all([
    db.saleListing.findMany({
      where: { status: "ACTIVE", userCard: { cardId: card.id } },
      include: {
        seller: { select: { username: true, displayName: true, city: true, state: true, verificationStatus: true } },
        userCard: true,
      },
      orderBy: { priceMyr: "asc" },
      take: 10,
    }),
    db.buyRequest.findMany({
      where: { status: "ACTIVE", cardId: card.id },
      include: { buyer: { select: { username: true, displayName: true, city: true, state: true } } },
      orderBy: { maxPriceMyr: "desc" },
      take: 10,
    }),
  ]);

  const lowestPrice = activeListings[0]?.priceMyr;
  const highestOffer = buyRequests[0]?.maxPriceMyr;
  const marketPrice = card.marketPriceMyr;

  return (
    <Container className="py-4 pb-32 sm:py-10 sm:pb-10">
      <Link
        href="/cards"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-brand-300"
      >
        <ChevronLeft size={16} /> Back to catalog
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Large card image with red glow behind */}
        <div className="relative">
          <div className="bg-red-glow absolute inset-0 -z-10" />
          <CardImage src={card.imageUrl} alt={card.name} className="max-w-[340px]" />
        </div>

        <div className="min-w-0">
          {/* Title block */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {card.cardCode} · {card.set.name}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                {card.name}
              </h1>
            </div>
            <RarityBadge rarity={card.rarity} className="px-2.5 py-1 text-[11px]" />
          </div>

          {/* Card facts */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="outline">{card.cardType}</Badge>
            {card.colors.map((c) => (
              <Badge key={c} variant="outline">{c}</Badge>
            ))}
            {card.isAlternateArt && <Badge variant="gold">Alt Art</Badge>}
            {card.isParallel && <Badge variant="gold">Parallel</Badge>}
            {card.isPromo && <Badge variant="gold">Promo</Badge>}
          </div>

          {/* Price panel */}
          <Card className="mt-5 surface-glass">
            <CardContent className="grid grid-cols-3 gap-3 p-4 sm:p-5">
              <PriceStat
                label="Market price"
                value={marketPrice != null ? formatMyr(marketPrice) : "—"}
                hint={marketPrice == null ? "Not tracked yet" : "Latest reference"}
                accent="gold"
              />
              <PriceStat
                label="Lowest ask"
                value={lowestPrice != null ? formatMyr(lowestPrice) : "—"}
                hint={`${activeListings.length} listing${activeListings.length === 1 ? "" : "s"}`}
                accent="brand"
              />
              <PriceStat
                label="Highest offer"
                value={highestOffer != null ? formatMyr(highestOffer) : "—"}
                hint={`${buyRequests.length} buyer${buyRequests.length === 1 ? "" : "s"}`}
                accent="success"
              />
            </CardContent>
          </Card>

          {/* Stats grid */}
          {(card.cost != null || card.power != null || card.counter != null || card.life != null) && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Cost" value={card.cost} />
              <Stat label="Power" value={card.power} />
              <Stat label="Counter" value={card.counter} />
              <Stat label="Life" value={card.life} />
            </div>
          )}

          {/* Effect text */}
          {card.effectText && (
            <div className="mt-5 rounded-2xl border border-white/5 bg-slate-900/60 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-brand-400">
                Effect
              </p>
              <p className="mt-1.5 whitespace-pre-line text-sm text-slate-200">{card.effectText}</p>
            </div>
          )}
          {card.triggerText && (
            <div className="mt-3 rounded-2xl border border-white/5 bg-slate-900/60 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gold-500">
                Trigger
              </p>
              <p className="mt-1.5 whitespace-pre-line text-sm text-slate-200">{card.triggerText}</p>
            </div>
          )}

          {/* CTAs (desktop) */}
          <div className="mt-6 hidden flex-wrap gap-2 sm:flex">
            <Link href={`/collection/add?cardCode=${card.cardCode}`}>
              <Button>
                <Plus size={16} /> Add to collection
              </Button>
            </Link>
            <Link href={`/buy-requests/new?cardCode=${card.cardCode}`}>
              <Button variant="secondary">
                <Heart size={16} /> Add to want list
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Available now */}
      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight text-slate-50">
          <Flame size={18} className="-mt-1 mr-1 inline text-brand-400" />
          Available now
        </h2>
        <p className="text-sm text-slate-400">{activeListings.length} active listing(s)</p>

        {activeListings.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-white/8 p-6 text-center text-sm text-slate-500">
            No one is selling this card yet.
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {activeListings.map((l) => (
              <Card key={l.id} className="card-lift">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-base font-bold text-slate-50">{formatMyr(l.priceMyr)}</p>
                    <p className="text-xs text-slate-400">
                      {CONDITION_LABELS[l.userCard.condition]} · {LANGUAGE_LABELS[l.userCard.language]}
                      {l.seller.city && ` · ${l.seller.city}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">@{l.seller.username}</p>
                  </div>
                  <Link href={`/marketplace/${l.id}`}>
                    <Button size="sm" variant="secondary">View</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Buy requests */}
      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight text-slate-50">People wanting this card</h2>
        <p className="text-sm text-slate-400">{buyRequests.length} active buy request(s)</p>

        {buyRequests.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-white/8 p-6 text-center text-sm text-slate-500">
            No buy requests yet.
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {buyRequests.map((b) => (
              <Card key={b.id} className="card-lift">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-base font-bold text-success-500">Up to {formatMyr(b.maxPriceMyr)}</p>
                    <p className="text-xs text-slate-400">
                      Min cond: {CONDITION_LABELS[b.minCondition]} · Qty {b.quantity}
                      {b.preferredCity && ` · ${b.preferredCity}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">@{b.buyer.username}</p>
                  </div>
                  <Link href={`/buy-requests/${b.id}`}>
                    <Button size="sm" variant="secondary">View</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Sticky mobile CTAs */}
      <StickyMobileBar>
        <div className="flex gap-2">
          <Link href={`/collection/add?cardCode=${card.cardCode}`} className="flex-1">
            <Button className="w-full">
              <Plus size={16} /> Add to collection
            </Button>
          </Link>
          <Link href={`/buy-requests/new?cardCode=${card.cardCode}`} className="flex-1">
            <Button variant="secondary" className="w-full">
              <Heart size={16} /> Want
            </Button>
          </Link>
        </div>
      </StickyMobileBar>
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: number | null | undefined }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/60 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-base font-bold text-slate-100">{value}</p>
    </div>
  );
}

function PriceStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: "brand" | "gold" | "success";
}) {
  const colorMap = {
    brand: "text-brand-400",
    gold: "text-gold-500",
    success: "text-success-500",
  };
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-bold sm:text-lg ${colorMap[accent]}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}
