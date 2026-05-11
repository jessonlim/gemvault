import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getUserCard } from "@/services/collection";
import { findMatchingBuyRequests } from "@/services/matching";
import { CardImage } from "@/components/cards/CardImage";
import { Card, CardContent } from "@/components/ui/card";
import { MatchingBuyRequests } from "@/components/marketplace/MatchingBuyRequests";
import { EditCardForm } from "./edit-card-form";
import { SellModeForm } from "./sell-mode-form";
import { DeleteCardButton } from "./delete-card-button";

export const dynamic = "force-dynamic";

export default async function EditCollectionCardPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const userCard = await getUserCard(params.id, profile.id);
  if (!userCard) notFound();

  // Show buyer demand if this card is exposed to the market
  const askPrice =
    userCard.sellMode === "LISTED_FOR_SALE"
      ? userCard.saleListing?.priceMyr
      : userCard.sellMode === "OPEN_TO_OFFERS"
        ? userCard.sellPreference?.minimumPriceMyr
        : null;

  const buyerMatches =
    askPrice != null
      ? await findMatchingBuyRequests({
          cardId: userCard.cardId,
          condition: userCard.condition,
          askPriceMyr: askPrice,
          language: userCard.language,
        })
      : [];

  return (
    <div className="max-w-2xl">
      <Link href="/collection" className="text-sm text-brand-400 hover:underline">
        ← Back to collection
      </Link>

      <div className="mt-3 flex gap-4">
        <div className="w-24 flex-shrink-0">
          <CardImage src={userCard.card.imageUrl} alt={userCard.card.name} />
        </div>
        <div>
          <p className="text-xs text-slate-500">
            {userCard.card.cardCode} · {userCard.card.set.name}
          </p>
          <h1 className="text-xl font-semibold text-slate-50">{userCard.card.name}</h1>
          <p className="text-sm text-slate-400">
            {userCard.card.rarity} · {userCard.card.cardType}
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="p-5">
          <h2 className="font-semibold text-slate-100">Card details</h2>
          <p className="text-xs text-slate-400">Condition, quantity, language, photo.</p>
          <EditCardForm
            userCardId={userCard.id}
            defaults={{
              quantity: userCard.quantity,
              condition: userCard.condition,
              language: userCard.language,
              isAlternateArt: userCard.isAlternateArt,
              note: userCard.note,
              photoUrl: userCard.photoUrl,
            }}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-5">
          <h2 className="font-semibold text-slate-100">Selling mode</h2>
          <p className="text-xs text-slate-400">
            Choose how (or whether) buyers can find this card.
          </p>
          <SellModeForm
            userCardId={userCard.id}
            currentMode={userCard.sellMode}
            saleListing={userCard.saleListing}
            sellPreference={userCard.sellPreference}
          />
        </CardContent>
      </Card>

      {askPrice != null && <MatchingBuyRequests requests={buyerMatches} />}

      <div className="mt-6 flex justify-end">
        <DeleteCardButton userCardId={userCard.id} />
      </div>
    </div>
  );
}
