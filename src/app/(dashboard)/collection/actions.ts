"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import {
  addCardToCollection,
  addUserCardSchema,
  deleteUserCard,
  setSellMode,
  sellModeSchema,
  updateUserCard,
  updateUserCardSchema,
} from "@/services/collection";

export type ActionState = { error?: string; success?: boolean } | null;

export async function addCardAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile();

  const parsed = addUserCardSchema.safeParse({
    cardCode: formData.get("cardCode"),
    quantity: formData.get("quantity"),
    condition: formData.get("condition"),
    language: formData.get("language"),
    isAlternateArt: formData.get("isAlternateArt") === "on",
    note: formData.get("note") || null,
    photoUrl: formData.get("photoUrl") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await addCardToCollection(profile.id, parsed.data);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/collection");
  redirect("/collection");
}

export async function updateCardAction(
  userCardId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile();

  const parsed = updateUserCardSchema.safeParse({
    quantity: formData.get("quantity"),
    condition: formData.get("condition"),
    language: formData.get("language"),
    isAlternateArt: formData.get("isAlternateArt") === "on",
    note: formData.get("note") || null,
    photoUrl: formData.get("photoUrl") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await updateUserCard(userCardId, profile.id, parsed.data);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath(`/collection/${userCardId}`);
  revalidatePath("/collection");
  return { success: true };
}

export async function setSellModeAction(
  userCardId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile();
  const sellMode = formData.get("sellMode") as string;

  let payload: unknown;
  if (sellMode === "COLLECTION") {
    payload = { sellMode };
  } else if (sellMode === "OPEN_TO_OFFERS") {
    payload = {
      sellMode,
      minimumPriceMyr: formData.get("minimumPriceMyr"),
      shippingPref: formData.get("shippingPref"),
      note: formData.get("note") || null,
    };
  } else if (sellMode === "LISTED_FOR_SALE") {
    payload = {
      sellMode,
      priceMyr: formData.get("priceMyr"),
      shippingPref: formData.get("shippingPref"),
      shippingFeeMyr: formData.get("shippingFeeMyr") || null,
      description: formData.get("description") || null,
    };
  } else {
    return { error: "Invalid sell mode" };
  }

  const parsed = sellModeSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await setSellMode(userCardId, profile.id, parsed.data);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath(`/collection/${userCardId}`);
  revalidatePath("/collection");
  revalidatePath("/listings");
  revalidatePath("/offers");
  return { success: true };
}

export async function deleteCardAction(userCardId: string) {
  const profile = await requireProfile();
  await deleteUserCard(userCardId, profile.id);
  revalidatePath("/collection");
  redirect("/collection");
}
