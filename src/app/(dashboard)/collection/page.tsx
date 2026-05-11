import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getUserCollection } from "@/services/collection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConditionBadge } from "@/components/ui/condition-badge";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { Card, CardContent } from "@/components/ui/card";
import { CardImage } from "@/components/cards/CardImage";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMyr } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import type { SellMode } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: { q?: string; sellMode?: SellMode };
}) {
  const profile = await requireProfile();
  const cards = await getUserCollection(profile.id, {
    q: searchParams.q,
    sellMode: searchParams.sellMode,
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">My Collection</h1>
          <p className="mt-1 text-sm text-slate-400">
            {cards.length} {cards.length === 1 ? "card" : "cards"} in your vault.
          </p>
        </div>
        <Link href="/cards">
          <Button>
            <Plus size={16} /> Add card
          </Button>
        </Link>
      </div>

      <FilterTabs current={searchParams.sellMode} />

      {cards.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Search size={28} />}
          title="Your vault is empty"
          description="Start by adding your first card from the catalog."
          action={
            <Link href="/cards">
              <Button>Browse catalog</Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((uc) => {
            const price =
              uc.sellMode === "LISTED_FOR_SALE"
                ? uc.saleListing?.priceMyr
                : uc.sellMode === "OPEN_TO_OFFERS"
                  ? uc.sellPreference?.minimumPriceMyr
                  : null;

            return (
              <Link key={uc.id} href={`/collection/${uc.id}`}>
                <Card className="card-lift h-full overflow-hidden p-0">
                  <div className="relative">
                    <CardImage src={uc.card.imageUrl} alt={uc.card.name} className="rounded-b-none" />
                    {/* Top-right status badge overlay */}
                    <div className="absolute right-2 top-2">
                      <StatusBadge status={uc.sellMode} />
                    </div>
                    {uc.quantity > 1 && (
                      <div className="absolute left-2 top-2 rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[11px] font-bold text-white backdrop-blur">
                        ×{uc.quantity}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      {uc.card.cardCode} · {uc.card.set.code}
                    </p>
                    <p className="line-clamp-1 mt-0.5 text-sm font-semibold text-slate-100">
                      {uc.card.name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <RarityBadge rarity={uc.card.rarity} />
                      <ConditionBadge condition={uc.condition} />
                    </div>
                    {price != null && (
                      <p className="mt-2 text-sm font-bold text-slate-50">{formatMyr(price)}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterTabs({ current }: { current?: SellMode }) {
  const tabs: { key: SellMode | "ALL"; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "COLLECTION", label: "Collection only" },
    { key: "OPEN_TO_OFFERS", label: "Open to offers" },
    { key: "LISTED_FOR_SALE", label: "Listed for sale" },
  ];
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {tabs.map((t) => {
        const href = t.key === "ALL" ? "/collection" : `/collection?sellMode=${t.key}`;
        const active = (current ?? "ALL") === t.key;
        return (
          <Link
            key={t.key}
            href={href}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-brand-500/60 bg-brand-600/20 text-brand-300"
                : "border-white/8 bg-slate-900/60 text-slate-400 hover:text-slate-100"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
