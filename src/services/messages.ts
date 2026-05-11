import { db } from "@/lib/db";

interface OpenConversationInput {
  buyerId: string;
  sellerId: string;
  saleListingId?: string | null;
  initialMessage?: string;
}

/**
 * Get-or-create a conversation between a buyer and a seller.
 * `saleListingId` may be null — that's the "general contact" (open-to-offers, buy request, etc.).
 *
 * Note: the unique constraint is on (buyerId, sellerId, saleListingId), so a buyer can have
 * one conversation per (seller, listing) combination, plus one general conversation per seller.
 */
export async function openConversation(input: OpenConversationInput) {
  if (input.buyerId === input.sellerId) {
    throw new Error("You can't message yourself.");
  }

  const existing = input.saleListingId
    ? await db.conversation.findUnique({
        where: {
          buyerId_sellerId_saleListingId: {
            buyerId: input.buyerId,
            sellerId: input.sellerId,
            saleListingId: input.saleListingId,
          },
        },
      })
    : await db.conversation.findFirst({
        where: {
          buyerId: input.buyerId,
          sellerId: input.sellerId,
          saleListingId: null,
        },
      });

  let conversation = existing;
  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        saleListingId: input.saleListingId ?? null,
      },
    });
  }

  if (input.initialMessage?.trim()) {
    await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: input.buyerId,
        body: input.initialMessage.trim(),
      },
    });
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
  }

  return conversation;
}

export async function listConversationsForUser(profileId: string) {
  return db.conversation.findMany({
    where: { OR: [{ buyerId: profileId }, { sellerId: profileId }] },
    include: {
      buyer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      seller: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      saleListing: {
        include: { userCard: { include: { card: { select: { name: true, cardCode: true, imageUrl: true } } } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}

export async function getConversationForUser(conversationId: string, profileId: string) {
  const convo = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      buyer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      seller: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      saleListing: {
        include: { userCard: { include: { card: { select: { name: true, cardCode: true, imageUrl: true } } } } },
      },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!convo) return null;
  if (convo.buyerId !== profileId && convo.sellerId !== profileId) return null;

  return convo;
}

export async function postMessage(
  conversationId: string,
  senderId: string,
  body: string
) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message can't be empty.");
  if (trimmed.length > 2000) throw new Error("Message is too long.");

  const convo = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!convo) throw new Error("Conversation not found.");
  if (convo.buyerId !== senderId && convo.sellerId !== senderId) {
    throw new Error("You can't post in this conversation.");
  }

  const message = await db.message.create({
    data: { conversationId, senderId, body: trimmed },
  });

  await db.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return message;
}

export async function markConversationRead(conversationId: string, profileId: string) {
  await db.message.updateMany({
    where: {
      conversationId,
      senderId: { not: profileId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export async function unreadConversationCount(profileId: string) {
  return db.conversation.count({
    where: {
      OR: [{ buyerId: profileId }, { sellerId: profileId }],
      messages: { some: { senderId: { not: profileId }, readAt: null } },
    },
  });
}
