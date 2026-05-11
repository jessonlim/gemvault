import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { listMyBuyRequests } from "@/services/buy-requests";
import { findMatchingListings, findMatchingOffers } from "@/services/matching";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConditionBadge } from "@/components/ui/condition-badge";
import { CardImage } from "@/components/cards/CardImage";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatMyr, timeAgo } from "@/lib/utils";
import { Plus, Search } from "lucide-react";

export const dynamic = "force-dynamic";

type BuyRequestStatus = "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED";

export default async function MyBuyRequestsPage() {
  const profile = await requireProfile();
  const requests = await listMyBuyRequests(profile.id);

  // Compute match status for each
  const enriched = await Promise.all(
    requests.map(async (r) => {
      if (r.status !== "ACTIVE") return { r, sellersFound: 0 };
      const [listings, offers] = await Promise.all([
        findMatchingListings(
          { cardId: r.cardId, minCondition: r.minCondition, maxPriceMyr: r.maxPriceMyr, language: r.language },
          5
        ),
        findMatchingOffers(
          { cardId: r.cardId, minCondition: r.minCondition, maxPriceMyr: r.maxPriceMyr, language: r.language },
          5
        ),
      ]);
      return { r, sellersFound: listings.length + offers.length };
    })
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">Want List</h1>
          <p className="mt-1 text-sm text-slate-400">
            Cards you&apos;re hunting. We&apos;ll show you matching sellers.
          </p>
        </div>
        <Link href="/cards">
          <Button>
            <Plus size={16} /> New buy request
          </Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={<Search size={28} />}
          title="No buy requests yet"
          description="Post what you want at the price you'll pay. Sellers can find you, and we'll surface matching listings."
          action={
            <Link href="/cards">
              <Button>Browse catalog</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {enriched.map(({ r, sellersFound }) => (
            <Link key={r.id} href={`/buy-requests/${r.id}`}>
              <Card className="card-lift">
                <CardContent className="flex gap-3 p-3">
                  <div className="w-20 flex-shrink-0">
                    <CardImage src={r.card.imageUrl} alt={r.card.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        {r.card.cardCode} · {r.card.set.code}
                      </p>
                      <WantStatusBadge status={r.status as BuyRequestStatus} sellersFound={sellersFound} />
                    </div>
                    <p className="line-clamp-1 mt-0.5 text-sm font-semibold text-slate-100">{r.card.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <ConditionBadge condition={r.minCondition} />
                      {r.quantity > 1 && <Badge>×{r.quantity}</Badge>}
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500">Target</p>
                        <p className="text-sm font-bold text-success-500">
                          Up to {formatMyr(r.maxPriceMyr)}
                        </p>
                      </div>
                      {sellersFound > 0 && r.status === "ACTIVE" && (
                        <p className="text-[11px] font-medium text-brand-400">
                          {sellersFound} match{sellersFound === 1 ? "" : "es"}
                        </p>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">{timeAgo(r.createdAt)}</p>
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

function WantStatusBadge({
  status,
  sellersFound,
}: {
  status: BuyRequestStatus;
  sellersFound: number;
}) {
  if (status === "ACTIVE") {
    if (sellersFound > 0) return <Badge variant="brand">Seller Found</Badge>;
    return <Badge variant="warning">Waiting</Badge>;
  }
  if (status === "FULFILLED") return <Badge variant="success">Fulfilled</Badge>;
  if (status === "CANCELLED") return <Badge variant="danger">Cancelled</Badge>;
  return <Badge>{status}</Badge>;
}
