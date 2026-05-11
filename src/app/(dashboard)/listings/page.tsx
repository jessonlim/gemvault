import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { ConditionBadge } from "@/components/ui/condition-badge";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { CardImage } from "@/components/cards/CardImage";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatMyr } from "@/lib/utils";
import { Tag, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const profile = await requireProfile();

  const listings = await db.saleListing.findMany({
    where: { sellerId: profile.id },
    include: {
      userCard: {
        include: { card: { include: { set: { select: { code: true, name: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">My Sale Listings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Active fixed-price listings. Edit a card&apos;s selling mode to change its price or unlist.
        </p>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={<Tag size={28} />}
          title="No active listings"
          description="Open a card in your collection and switch its mode to 'Listed for sale'."
          action={
            <Link href="/collection">
              <Button>Go to collection</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <Link key={l.id} href={`/collection/${l.userCardId}`}>
              <Card className="card-lift overflow-hidden p-0">
                <div className="relative">
                  <CardImage src={l.userCard.card.imageUrl} alt={l.userCard.card.name} className="rounded-b-none" />
                  <div className="absolute right-2 top-2">
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="absolute left-2 top-2">
                    <RarityBadge rarity={l.userCard.card.rarity} />
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {l.userCard.card.cardCode}
                  </p>
                  <p className="line-clamp-1 mt-0.5 text-sm font-semibold text-slate-100">
                    {l.userCard.card.name}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <ConditionBadge condition={l.userCard.condition} />
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500">
                      <Eye size={10} /> {l.views}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-bold text-slate-50">{formatMyr(l.priceMyr)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
