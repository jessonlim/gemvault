"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import {
  cancelBuyRequest,
  createBuyRequest,
  createBuyRequestSchema,
  updateBuyRequest,
  updateBuyRequestSchema,
} from "@/services/buy-requests";

export type ActionState = { error?: string; success?: boolean } | null;

export async function createBuyRequestAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile();

  const parsed = createBuyRequestSchema.safeParse({
    cardCode: formData.get("cardCode"),
    minCondition: formData.get("minCondition"),
    language: formData.get("language") || null,
    quantity: formData.get("quantity"),
    maxPriceMyr: formData.get("maxPriceMyr"),
    shippingPref: formData.get("shippingPref"),
    preferredCity: formData.get("preferredCity") || null,
    preferredState: formData.get("preferredState") || null,
    note: formData.get("note") || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let request;
  try {
    request = await createBuyRequest(profile.id, parsed.data);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/buy-requests/mine");
  revalidatePath("/buy-requests");
  redirect(`/buy-requests/${request.id}`);
}

export async function updateBuyRequestAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile();

  const parsed = updateBuyRequestSchema.safeParse({
    minCondition: formData.get("minCondition") || undefined,
    language: formData.get("language") || null,
    quantity: formData.get("quantity") || undefined,
    maxPriceMyr: formData.get("maxPriceMyr") || undefined,
    shippingPref: formData.get("shippingPref") || undefined,
    preferredCity: formData.get("preferredCity") || null,
    preferredState: formData.get("preferredState") || null,
    note: formData.get("note") || null,
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await updateBuyRequest(id, profile.id, parsed.data);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath(`/buy-requests/${id}`);
  revalidatePath("/buy-requests/mine");
  return { success: true };
}

export async function cancelBuyRequestAction(id: string) {
  const profile = await requireProfile();
  await cancelBuyRequest(id, profile.id);
  revalidatePath(`/buy-requests/${id}`);
  revalidatePath("/buy-requests/mine");
  redirect("/buy-requests/mine");
}
