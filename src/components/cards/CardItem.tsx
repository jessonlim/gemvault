import Link from "next/link";
import type { Card as DbCard, CardSet } from "@prisma/client";
import { CardImage } from "./CardImage";
import { Badge } from "@/components/ui/badge";

type CardWithSet = DbCard & { set: Pick<CardSet, "code" | "name"> };

export function CardItem({ card }: { card: CardWithSet }) {
  return (
    <Link
      href={`/cards/${card.cardCode}`}
      className="group flex flex-col gap-2"
    >
      <CardImage
        src={card.imageUrl}
        alt={card.name}
        className="transition group-hover:ring-2 group-hover:ring-brand-500"
      />
      <div className="space-y-0.5">
        <p className="text-xs text-slate-500">{card.cardCode}</p>
        <p className="line-clamp-2 text-sm font-medium text-slate-100">
          {card.name}
        </p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">{card.rarity}</Badge>
          {card.colors.slice(0, 2).map((c) => (
            <Badge key={c} variant="default">{c}</Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}
