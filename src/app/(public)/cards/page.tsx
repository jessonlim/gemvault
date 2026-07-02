import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { CardGrid } from "@/components/cards/CardGrid";
import { CardFilters } from "@/components/cards/CardFilters";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/marketplace/Pagination";
import { searchCards, getAllSets, getFilterOptions, GAME_LABELS } from "@/services/cards";
import { Game } from "@prisma/client";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const GAMES: Game[] = ["ONE_PIECE", "POKEMON"];

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const page = parseInt(searchParams.page ?? "1", 10);
  const game: Game = GAMES.includes(searchParams.game as Game)
    ? (searchParams.game as Game)
    : "ONE_PIECE";

  const [{ cards, total, totalPages }, sets, filterOptions] = await Promise.all([
    searchCards({
      q: searchParams.q,
      game,
      setCode: searchParams.setCode,
      rarity: searchParams.rarity,
      cardType: searchParams.cardType,
      color: searchParams.color,
      page,
    }),
    getAllSets(game),
    getFilterOptions(game),
  ]);

  return (
    <Container className="py-6 pb-24 sm:py-10 sm:pb-10">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">Card catalog</h1>
        <p className="mt-1 text-sm text-slate-400">
          {total.toLocaleString()} {GAME_LABELS[game]} cards in the database.
        </p>
      </div>

      {/* Game tabs */}
      <div className="mb-4 flex gap-2 border-b border-white/5">
        {GAMES.map((g) => {
          const active = g === game;
          const href = g === "ONE_PIECE" ? "/cards" : `/cards?game=${g}`;
          return (
            <Link
              key={g}
              href={href}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-brand-500 text-brand-300"
                  : "border-transparent text-slate-400 hover:text-slate-100"
              )}
            >
              {GAME_LABELS[g]}
            </Link>
          );
        })}
      </div>

      <CardFilters
        sets={sets}
        game={game}
        rarities={filterOptions.rarities}
        cardTypes={filterOptions.cardTypes}
        colors={filterOptions.colors}
      />

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

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/cards"
        searchParams={searchParams}
      />
    </Container>
  );
}
