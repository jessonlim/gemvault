import { redirect } from "next/navigation";

/**
 * /dashboard now redirects to the root (which renders the authed home dashboard).
 * Kept as a route so existing links work.
 */
export default function DashboardRedirectPage() {
  redirect("/");
}
