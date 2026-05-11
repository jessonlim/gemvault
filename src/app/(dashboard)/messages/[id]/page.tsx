import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getConversationForUser, markConversationRead } from "@/services/messages";
import { CardImage } from "@/components/cards/CardImage";
import { MessageInput } from "./message-input";
import { formatMyr, timeAgo } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const convo = await getConversationForUser(params.id, profile.id);
  if (!convo) notFound();

  void markConversationRead(convo.id, profile.id);

  const otherParty = convo.buyerId === profile.id ? convo.seller : convo.buyer;
  const listing = convo.saleListing;

  return (
    <>
      {/* Sticky thread header */}
      <div className="sticky top-14 z-10 -mx-4 border-b border-slate-800 bg-slate-950/95 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:mb-4 sm:rounded-xl sm:border sm:bg-slate-900/60 sm:px-4 sm:py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-300 hover:bg-slate-800 sm:hidden"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600/30 text-sm font-semibold text-brand-300">
            {(otherParty.displayName ?? otherParty.username).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${otherParty.username}`}
              className="block truncate text-sm font-medium text-slate-100 hover:underline"
            >
              {otherParty.displayName ?? otherParty.username}
            </Link>
            <p className="truncate text-xs text-slate-400">@{otherParty.username}</p>
          </div>
          {listing && (
            <Link href={`/marketplace/${listing.id}`} className="flex-shrink-0">
              <div className="flex items-center gap-2 rounded-md bg-slate-800/60 p-1.5 text-xs">
                <div className="w-8">
                  <CardImage src={listing.userCard.card.imageUrl} alt={listing.userCard.card.name} />
                </div>
                <div className="hidden xs:block">
                  <p className="line-clamp-1 max-w-[100px] font-medium text-slate-100">
                    {listing.userCard.card.name}
                  </p>
                  <p className="text-slate-400">{formatMyr(listing.priceMyr)}</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Messages list — natural flow; extra bottom padding so input doesn't cover content */}
      <div className="space-y-2 pb-40 pt-4 sm:pb-4">
        {convo.messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No messages yet — say hi.</p>
        ) : (
          convo.messages.map((m) => {
            const mine = m.senderId === profile.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm sm:max-w-[70%] ${
                    mine
                      ? "rounded-br-sm bg-brand-600 text-white"
                      : "rounded-bl-sm bg-slate-800 text-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-brand-200" : "text-slate-500"}`}>
                    {timeAgo(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input — fixed above the mobile tab bar on small screens, in-flow on desktop */}
      <div
        className="fixed inset-x-0 bottom-14 z-20 border-t border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur sm:static sm:mt-2 sm:bottom-auto sm:px-0 sm:py-0"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <MessageInput conversationId={convo.id} />
        <p className="mt-1.5 text-center text-[10px] text-slate-600">
          Stay safe — never share payment info or personal details.
        </p>
      </div>
    </>
  );
}
