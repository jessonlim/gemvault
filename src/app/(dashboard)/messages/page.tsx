import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { listConversationsForUser } from "@/services/messages";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CardImage } from "@/components/cards/CardImage";
import { timeAgo, formatMyr } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const profile = await requireProfile();
  const conversations = await listConversationsForUser(profile.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50">Messages</h1>
      <p className="mt-1 text-sm text-slate-400">Conversations with buyers and sellers.</p>

      {conversations.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<MessageCircle size={28} />}
          title="No conversations yet"
          description="When you contact a seller or someone messages you about a card, it'll show up here."
        />
      ) : (
        <div className="mt-5 space-y-2">
          {conversations.map((c) => {
            const otherParty = c.buyerId === profile.id ? c.seller : c.buyer;
            const isBuyer = c.buyerId === profile.id;
            const lastMessage = c.messages[0];
            const cardName = c.saleListing?.userCard.card.name;
            const cardImage = c.saleListing?.userCard.card.imageUrl;
            const unread =
              lastMessage && lastMessage.senderId !== profile.id && !lastMessage.readAt;

            return (
              <Link key={c.id} href={`/messages/${c.id}`}>
                <Card className="transition hover:border-slate-700">
                  <CardContent className="flex items-center gap-3 p-3">
                    {cardImage ? (
                      <div className="w-12 flex-shrink-0">
                        <CardImage src={cardImage} alt={cardName ?? ""} />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-600/30 text-sm font-semibold text-brand-300">
                        {(otherParty.displayName ?? otherParty.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-100">
                          {otherParty.displayName ?? otherParty.username}
                          <span className="ml-1 text-xs font-normal text-slate-500">
                            · {isBuyer ? "you ↔ seller" : "buyer ↔ you"}
                          </span>
                        </p>
                        <span className="flex-shrink-0 text-xs text-slate-500">
                          {lastMessage ? timeAgo(lastMessage.createdAt) : timeAgo(c.lastMessageAt)}
                        </span>
                      </div>
                      {cardName && (
                        <p className="text-xs text-slate-400">
                          About: {cardName}
                          {c.saleListing && ` · ${formatMyr(c.saleListing.priceMyr)}`}
                        </p>
                      )}
                      {lastMessage && (
                        <p className={`mt-0.5 truncate text-xs ${unread ? "text-slate-100 font-medium" : "text-slate-500"}`}>
                          {lastMessage.senderId === profile.id ? "You: " : ""}
                          {lastMessage.body}
                        </p>
                      )}
                    </div>
                    {unread && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />}
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
