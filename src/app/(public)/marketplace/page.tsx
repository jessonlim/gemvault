import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ListingItem } from "@/components/marketplace/ListingItem";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { Pagination } from "@/components/marketplace/Pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { searchSaleListings } from "@/services/marketplace";
import { getAllSets } from "@/services/cards";
import type { CardCondition, CardLanguage } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const page = parseInt(searchParams.page ?? "1", 10);

  const [{ listings, total, totalPages }, sets] = await Promise.all([
    searchSaleListings({
      q: searchParams.q,
      setCode: searchParams.setCode,
      rarity: searchParams.rarity,
      cardType: searchParams.cardType,
      color: searchParams.color,
      condition: searchParams.condition as CardCondition | undefined,
      language: searchParams.language as CardLanguage | undefined,
      minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
      city: searchParams.city,
      state: searchParams.state,
      page,
    }),
    getAllSets(),
  ]);

  return (
    <Container className="py-6 pb-24 sm:py-10 sm:pb-10">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Marketplace</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total.toLocaleString()} active listing{total === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      {/* Tabs: Listings | Open to offers */}
      <div className="mb-4 flex gap-2 border-b border-slate-800">
        <Link
          href="/marketplace"
          className="border-b-2 border-brand-500 px-3 py-2 text-sm font-medium text-brand-300"
        >
          Listings
        </Link>
        <Link
          href="/marketplace/offers"
          className="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-100"
        >
          Open to offers
        </Link>
      </div>

      <MarketplaceFilters sets={sets} basePath="/marketplace" />

      <div className="mt-6">
        {listings.length === 0 ? (
          <EmptyState
            title="No listings match"
            description="Try clearing some filters or check back later."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => <ListingItem key={l.id} listing={l} />)}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/marketplace"
        searchParams={searchParams}
      />
    </Container>
  );
}
