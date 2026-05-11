import Link from "next/link";
import type { SaleListing, UserCard, Card as DbCard, CardSet, Profile } from "@prisma/client";
import { CardImage } from "@/components/cards/CardImage";
import { ConditionBadge } from "@/components/ui/condition-badge";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMyr } from "@/lib/utils";
import { ShieldCheck, MapPin } from "lucide-react";

type ListingFull = SaleListing & {
  userCard: UserCard & { card: DbCard & { set: Pick<CardSet, "code" | "name"> } };
  seller: Pick<Profile, "id" | "username" | "displayName" | "city" | "state" | "verificationStatus">;
};

export function ListingItem({ listing }: { listing: ListingFull }) {
  const { userCard, seller } = listing;
  const card = userCard.card;

  return (
    <Link href={`/marketplace/${listing.id}`}>
      <Card className="card-lift h-full overflow-hidden p-0">
        <div className="relative">
          <CardImage src={card.imageUrl} alt={card.name} className="rounded-b-none" />
          <div className="absolute left-2 top-2 flex gap-1">
            <RarityBadge rarity={card.rarity} />
          </div>
          <div className="absolute right-2 top-2">
            <ConditionBadge condition={userCard.condition} />
          </div>
        </div>
        <CardContent className="p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {card.cardCode} · {card.set.code}
          </p>
          <p className="line-clamp-1 mt-0.5 text-sm font-semibold text-slate-100">
            {card.name}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-base font-bold text-slate-50">{formatMyr(listing.priceMyr)}</p>
            {seller.verificationStatus === "VERIFIED" && (
              <ShieldCheck size={14} className="text-emerald-400" />
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>@{seller.username}</span>
            {seller.city && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={10} /> {seller.city}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
