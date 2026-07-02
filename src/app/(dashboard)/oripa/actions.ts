"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile, requireAdmin } from "@/lib/auth";
import {
  createSeries,
  createSeriesSchema,
  addPrize,
  addPrizeSchema,
  removePrize,
  activateSeries,
  archiveSeries,
  grantCredits,
  grantCreditsSchema,
  toggleSlotFulfilled,
  drawSlot,
  type DrawResult,
} from "@/services/oripa";

export type OripaActionState = { error?: string; success?: boolean } | null;

// ============== Admin actions ==============

export async function createSeriesAction(
  _prev: OripaActionState,
  formData: FormData
): Promise<OripaActionState> {
  const admin = await requireAdmin();

  const parsed = createSeriesSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    game: formData.get("game") || null,
    coverImageUrl: formData.get("coverImageUrl") || null,
    pricePerDrawMyr: formData.get("pricePerDrawMyr"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let series;
  try {
    series = await createSeries(admin.id, parsed.data);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/admin/oripa");
  redirect(`/admin/oripa/${series.id}`);
}

export async function addPrizeAction(
  _prev: OripaActionState,
  formData: FormData
): Promise<OripaActionState> {
  await requireAdmin();

  const parsed = addPrizeSchema.safeParse({
    seriesId: formData.get("seriesId"),
    tier: formData.get("tier"),
    name: formData.get("name"),
    cardCode: formData.get("cardCode") || null,
    imageUrl: formData.get("imageUrl") || null,
    quantity: formData.get("quantity"),
    estValueMyr: formData.get("estValueMyr") || null,
    isLastOne: formData.get("isLastOne") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await addPrize(parsed.data);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath(`/admin/oripa/${parsed.data.seriesId}`);
  return { success: true };
}

export async function removePrizeAction(prizeId: string, seriesId: string) {
  await requireAdmin();
  try {
    await removePrize(prizeId);
  } catch (err) {
    return { error: (err as Error).message };
  }
  revalidatePath(`/admin/oripa/${seriesId}`);
  return { success: true };
}

export async function activateSeriesAction(seriesId: string) {
  await requireAdmin();
  try {
    await activateSeries(seriesId);
  } catch (err) {
    return { error: (err as Error).message };
  }
  revalidatePath(`/admin/oripa/${seriesId}`);
  revalidatePath("/oripa");
  return { success: true };
}

export async function archiveSeriesAction(seriesId: string) {
  await requireAdmin();
  try {
    await archiveSeries(seriesId);
  } catch (err) {
    return { error: (err as Error).message };
  }
  revalidatePath(`/admin/oripa/${seriesId}`);
  revalidatePath("/oripa");
  return { success: true };
}

export async function grantCreditsAction(
  _prev: OripaActionState,
  formData: FormData
): Promise<OripaActionState> {
  const admin = await requireAdmin();

  const parsed = grantCreditsSchema.safeParse({
    seriesId: formData.get("seriesId"),
    username: formData.get("username"),
    credits: formData.get("credits"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await grantCredits(admin.id, parsed.data);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath(`/admin/oripa/${parsed.data.seriesId}`);
  return { success: true };
}

export async function toggleFulfilledAction(slotId: string, seriesId: string) {
  await requireAdmin();
  try {
    await toggleSlotFulfilled(slotId);
  } catch (err) {
    return { error: (err as Error).message };
  }
  revalidatePath(`/admin/oripa/${seriesId}`);
  return { success: true };
}

// ============== User action: the draw ==============

export type DrawActionResult =
  | { ok: true; result: DrawResult }
  | { ok: false; error: string };

export async function drawSlotAction(
  seriesId: string,
  slotNumber: number
): Promise<DrawActionResult> {
  const profile = await requireProfile();

  try {
    const result = await drawSlot(profile.id, seriesId, slotNumber);
    revalidatePath(`/oripa/${seriesId}`);
    revalidatePath("/oripa");
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
