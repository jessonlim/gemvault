"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { updateProfile, updateProfileSchema } from "@/services/profiles";

export type SettingsState = { error?: string; success?: boolean } | null;

export async function updateProfileAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const profile = await requireProfile();

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName") || null,
    bio: formData.get("bio") || null,
    avatarUrl: formData.get("avatarUrl") || null,
    city: formData.get("city") || null,
    state: formData.get("state") || null,
    country: formData.get("country") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await updateProfile(profile.id, parsed.data);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/settings");
  revalidatePath(`/profile/${profile.username}`);
  revalidatePath("/", "layout");
  return { success: true };
}
