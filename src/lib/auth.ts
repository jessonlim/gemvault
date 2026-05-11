import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import type { Profile } from "@prisma/client";

/**
 * Returns the current Supabase auth user (or null).
 */
export async function getAuthUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the user's Profile (DB row) or null.
 * Auto-creates a Profile on first login if missing.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getAuthUser();
  if (!user) return null;

  let profile = await db.profile.findUnique({ where: { userId: user.id } });

  if (!profile) {
    const baseUsername =
      (user.user_metadata?.username as string | undefined) ??
      user.email?.split("@")[0] ??
      `user_${user.id.slice(0, 6)}`;

    profile = await db.profile.create({
      data: {
        userId: user.id,
        email: user.email ?? "",
        username: await uniqueUsername(baseUsername),
        displayName: (user.user_metadata?.display_name as string) ?? baseUsername,
      },
    });
  }

  return profile;
}

/**
 * Hard requirement: redirect to /login if not authenticated.
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/**
 * Hard requirement: redirect non-admins to /dashboard.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "ADMIN" && profile.role !== "MODERATOR") {
    redirect("/dashboard");
  }
  return profile;
}

async function uniqueUsername(base: string): Promise<string> {
  const sanitized = base.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20);
  let candidate = sanitized || "user";
  let n = 0;
  while (await db.profile.findUnique({ where: { username: candidate } })) {
    n += 1;
    candidate = `${sanitized}_${n}`;
  }
  return candidate;
}
