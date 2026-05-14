"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import {
  markSold,
  markSoldSchema,
  confirmSale,
  disputeSale,
  cancelSale,
} from "@/services/sales";
import { submitRating, submitRatingSchema } from "@/services/ratings";

export type SaleActionState = { error?: string; success?: boolean } | null;

export async function markSoldAction(
  _prev: SaleActionState,
  formData: FormData
): Promise<SaleActionState> {
  const profile = await requireProfile();

  const parsed = markSoldSchema.safeParse({
    userCardId: formData.get("userCardId"),
    buyerUsername: formData.get("buyerUsername"),
    finalPriceMyr: formData.get("finalPriceMyr"),
    sellerNote: formData.get("sellerNote") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await markSold(profile.id, parsed.data);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/sales");
  revalidatePath("/listings");
  revalidatePath("/collection");
  redirect("/sales");
}

export async function confirmSaleAction(saleId: string) {
  const profile = await requireProfile();
  try {
    await confirmSale(saleId, profile.id);
  } catch (err) {
    return { error: (err as Error).message };
  }
  revalidatePath("/sales");
  revalidatePath("/");
  return { success: true };
}

export async function disputeSaleAction(saleId: string, note: string) {
  const profile = await requireProfile();
  try {
    await disputeSale(saleId, profile.id, note);
  } catch (err) {
    return { error: (err as Error).message };
  }
  revalidatePath("/sales");
  return { success: true };
}

export async function cancelSaleAction(saleId: string) {
  const profile = await requireProfile();
  try {
    await cancelSale(saleId, profile.id);
  } catch (err) {
    return { error: (err as Error).message };
  }
  revalidatePath("/sales");
  revalidatePath("/listings");
  return { success: true };
}

export async function submitRatingAction(
  _prev: SaleActionState,
  formData: FormData
): Promise<SaleActionState> {
  const profile = await requireProfile();

  const parsed = submitRatingSchema.safeParse({
    saleId: formData.get("saleId"),
    stars: formData.get("stars"),
    review: formData.get("review") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await submitRating(profile.id, parsed.data);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/sales");
  revalidatePath("/", "layout");
  return { success: true };
}
