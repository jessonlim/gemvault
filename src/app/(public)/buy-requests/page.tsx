import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { CardImage } from "@/components/cards/CardImage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { searchBuyRequests } from "@/services/buy-requests";
import { getAllSets, RARITIES, CARD_TYPES, COLORS } from "@/services/cards";
import { formatMyr, CONDITION_LABELS, timeAgo } from "@/lib/utils";
import { Pagination } from "@/components/marketplace/Pagination";
import { ShieldCheck, MapPin } from "lucide-react";
import { BuyRequestFilters } from "@/components/marketplace/BuyRequestFilters";
import type { CardLanguage } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function PublicBuyRequestsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const page = parseInt(searchParams.page ?? "1", 10);

  const [{ requests, total, totalPages }, sets] = await Promise.all([
    searchBuyRequests({
      q: searchParams.q,
      setCode: searchParams.setCode,
      rarity: searchParams.rarity,
      cardType: searchParams.cardType,
      color: searchParams.color,
      minMaxPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
      language: searchParams.language as CardLanguage | undefined,
      city: searchParams.city,
      state: searchParams.state,
      page,
    }),
    getAllSets(),
  ]);

  return (
    <Container className="py-6 pb-24 sm:py-10 sm:pb-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Buy requests</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total.toLocaleString()} active request{total === 1 ? "" : "s"}.
          </p>
        </div>
        <Link href="/buy-requests/new">
          <Button>+ New buy request</Button>
        </Link>
      </div>

      <BuyRequestFilters sets={sets} />

      <div className="mt-6">
        {requests.length === 0 ? (
          <EmptyState
            title="No buy requests match"
            description="Try clearing some filters or be the first to post a request."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((r) => (
              <Link key={r.id} href={`/buy-requests/${r.id}`}>
                <Card className="h-full transition hover:border-slate-700">
                  <CardContent className="flex gap-3 p-3">
                    <div className="w-20 flex-shrink-0 sm:w-24">
                      <CardImage src={r.card.imageUrl} alt={r.card.name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">{r.card.cardCode} · {r.card.set.code}</p>
                      <p className="line-clamp-1 text-sm font-medium text-slate-100">{r.card.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline">Min {CONDITION_LABELS[r.minCondition]}</Badge>
                        {r.quantity > 1 && <Badge>×{r.quantity}</Badge>}
                      </div>
                      <p className="mt-2 text-base font-semibold text-emerald-300">
                        Up to {formatMyr(r.maxPriceMyr)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
                        <span>@{r.buyer.username}</span>
                        {r.buyer.verificationStatus === "VERIFIED" && (
                          <ShieldCheck size={12} className="text-emerald-400" />
                        )}
                        {r.preferredCity && (
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin size={12} /> {r.preferredCity}
                          </span>
                        )}
                        <span className="ml-auto">{timeAgo(r.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/buy-requests"
        searchParams={searchParams}
      />
    </Container>
  );
}
