import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CardImage } from "@/components/cards/CardImage";
import { Button } from "@/components/ui/button";
import { AddCardForm } from "./add-card-form";

export const dynamic = "force-dynamic";

export default async function AddCardPage({
  searchParams,
}: {
  searchParams: { cardCode?: string };
}) {
  if (!searchParams.cardCode) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Add card to collection</h1>
        <p className="mt-1 text-sm text-slate-400">
          Pick a card from the catalog to add it to your collection.
        </p>
        <Link href="/cards" className="mt-4 inline-block">
          <Button>Browse catalog</Button>
        </Link>
      </div>
    );
  }

  const card = await db.card.findUnique({
    where: { cardCode: searchParams.cardCode },
    include: { set: true },
  });
  if (!card) notFound();

  return (
    <div className="max-w-xl">
      <Link href="/cards" className="text-sm text-brand-400 hover:underline">
        ← Pick a different card
      </Link>

      <div className="mt-3 flex gap-4">
        <div className="w-24 flex-shrink-0">
          <CardImage src={card.imageUrl} alt={card.name} />
        </div>
        <div>
          <p className="text-xs text-slate-500">{card.cardCode} · {card.set.name}</p>
          <h1 className="text-xl font-semibold text-slate-50">{card.name}</h1>
          <p className="text-sm text-slate-400">{card.rarity} · {card.cardType}</p>
        </div>
      </div>

      <AddCardForm cardCode={card.cardCode} />
    </div>
  );
}
