import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { CardGrid } from "@/components/cards/CardGrid";
import { CardFilters } from "@/components/cards/CardFilters";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { searchCards, getAllSets } from "@/services/cards";

export const dynamic = "force-dynamic";

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const page = parseInt(searchParams.page ?? "1", 10);

  const [{ cards, total, totalPages }, sets] = await Promise.all([
    searchCards({
      q: searchParams.q,
      setCode: searchParams.setCode,
      rarity: searchParams.rarity,
      cardType: searchParams.cardType,
      color: searchParams.color,
      page,
    }),
    getAllSets(),
  ]);

  return (
    <Container className="py-6 pb-24 sm:py-10 sm:pb-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Card catalog</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total.toLocaleString()} cards in the database.
          </p>
        </div>
      </div>

      <CardFilters sets={sets} />

      <div className="mt-6">
        {cards.length === 0 ? (
          <EmptyState
            title="No cards found"
            description="Try a different search or clear your filters."
          />
        ) : (
          <CardGrid cards={cards} />
        )}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} searchParams={searchParams} />
      )}
    </Container>
  );
}

function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  function buildHref(p: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== "page") params.set(k, v);
    });
    params.set("page", String(p));
    return `/cards?${params.toString()}`;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Link href={buildHref(Math.max(1, page - 1))}>
        <Button variant="outline" size="sm" disabled={page <= 1}>Prev</Button>
      </Link>
      <span className="text-sm text-slate-400">
        Page {page} of {totalPages}
      </span>
      <Link href={buildHref(Math.min(totalPages, page + 1))}>
        <Button variant="outline" size="sm" disabled={page >= totalPages}>Next</Button>
      </Link>
    </div>
  );
}
