import type { Card as DbCard, CardSet } from "@prisma/client";
import { CardItem } from "./CardItem";

type CardWithSet = DbCard & { set: Pick<CardSet, "code" | "name"> };

export function CardGrid({ cards }: { cards: CardWithSet[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  );
}
