import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { ConditionBadge } from "@/components/ui/condition-badge";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { Badge } from "@/components/ui/badge";
import { CardImage } from "@/components/cards/CardImage";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatMyr } from "@/lib/utils";
import { Heart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyOffersPage() {
  const profile = await requireProfile();

  const prefs = await db.sellPreference.findMany({
    where: { ownerId: profile.id },
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">Open to Offers</h1>
        <p className="mt-1 text-sm text-slate-400">
          Cards buyers can offer on. They&apos;ll see your minimum price and a link to message you.
        </p>
      </div>

      {prefs.length === 0 ? (
        <EmptyState
          icon={<Heart size={28} />}
          title="Nothing open to offers yet"
          description="Open a card in your collection and switch its mode to 'Open to offers'."
          action={
            <Link href="/collection">
              <Button>Go to collection</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {prefs.map((p) => (
            <Link key={p.id} href={`/collection/${p.userCardId}`}>
              <Card className="card-lift overflow-hidden p-0">
                <div className="relative">
                  <CardImage src={p.userCard.card.imageUrl} alt={p.userCard.card.name} className="rounded-b-none" />
                  <div className="absolute right-2 top-2">
                    <ConditionBadge condition={p.userCard.condition} />
                  </div>
                  <div className="absolute left-2 top-2">
                    <RarityBadge rarity={p.userCard.card.rarity} />
                  </div>
                  <div className="absolute bottom-2 left-2 rounded-md bg-gold-500/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-500 backdrop-blur">
                    OPEN
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {p.userCard.card.cardCode}
                  </p>
                  <p className="line-clamp-1 mt-0.5 text-sm font-semibold text-slate-100">
                    {p.userCard.card.name}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-gold-500">Min {formatMyr(p.minimumPriceMyr)}</p>
                    {!p.isActive && <Badge variant="outline">Paused</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
