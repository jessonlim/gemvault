import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create profile row if missing
      const existing = await db.profile.findUnique({ where: { userId: data.user.id } });
      if (!existing) {
        const meta = data.user.user_metadata ?? {};
        const baseUsername =
          (meta.username as string | undefined) ??
          data.user.email?.split("@")[0] ??
          `user_${data.user.id.slice(0, 6)}`;
        const sanitized = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20);

        // Find a free username
        let username = sanitized || "user";
        let n = 0;
        while (await db.profile.findUnique({ where: { username } })) {
          n += 1;
          username = `${sanitized}_${n}`;
        }

        await db.profile.create({
          data: {
            userId: data.user.id,
            email: data.user.email ?? "",
            username,
            displayName: (meta.display_name as string) ?? username,
          },
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback_failed`);
}
