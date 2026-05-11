import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

/**
 * /me — redirects to the logged-in user's public profile, or /login if not signed in.
 * Used by the mobile bottom-tab "Profile" link.
 */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/me");
  redirect(`/profile/${profile.username}`);
}
