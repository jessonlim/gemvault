"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { openConversation, postMessage } from "@/services/messages";
import { db } from "@/lib/db";

const startConversationSchema = z.object({
  recipientUsername: z.string().min(1),
  saleListingId: z.string().optional().nullable(),
  initialMessage: z.string().min(1).max(2000).optional(),
});

export type ContactState = { error?: string } | null;

/**
 * Start (or open) a conversation with a recipient (by username).
 * The current user is treated as the "buyer" side of the conversation.
 */
export async function startConversationAction(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const profile = await requireProfile();

  const parsed = startConversationSchema.safeParse({
    recipientUsername: formData.get("recipientUsername"),
    saleListingId: formData.get("saleListingId") || null,
    initialMessage: formData.get("initialMessage") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const recipient = await db.profile.findUnique({
    where: { username: parsed.data.recipientUsername.toLowerCase() },
  });
  if (!recipient) return { error: "User not found." };

  if (recipient.id === profile.id) return { error: "You can't message yourself." };

  let conversation;
  try {
    conversation = await openConversation({
      buyerId: profile.id,
      sellerId: recipient.id,
      saleListingId: parsed.data.saleListingId || null,
      initialMessage: parsed.data.initialMessage,
    });
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/messages");
  redirect(`/messages/${conversation.id}`);
}

const sendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function sendMessageAction(
  conversationId: string,
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const profile = await requireProfile();
  const parsed = sendMessageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await postMessage(conversationId, profile.id, parsed.data.body);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return null;
}
