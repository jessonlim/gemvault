import Link from "next/link";
import { Bell } from "lucide-react";
import { Container } from "./Container";
import { GemLogo } from "@/components/ui/gem-logo";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserMenu } from "./UserMenu";
import { NavbarSearch } from "./NavbarSearch";

export async function Navbar() {
  const profile = await getCurrentProfile();

  // Unread message count (badge on bell)
  let unread = 0;
  if (profile) {
    unread = await db.conversation.count({
      where: {
        OR: [{ buyerId: profile.id }, { sellerId: profile.id }],
        messages: { some: { senderId: { not: profile.id }, readAt: null } },
      },
    });
  }

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/85 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <GemLogo size={28} />
          <span className="text-base font-bold tracking-tight text-slate-50">GemVault</span>
        </Link>

        {/* Desktop search */}
        <div className="hidden flex-1 max-w-xl md:block">
          <NavbarSearch />
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            href="/cards"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800/70 hover:text-white"
          >
            Cards
          </Link>
          <Link
            href="/marketplace"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800/70 hover:text-white"
          >
            Market
          </Link>
          <Link
            href="/buy-requests"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800/70 hover:text-white"
          >
            Want List
          </Link>
        </nav>

        <div className="flex flex-shrink-0 items-center gap-2">
          {profile && (
            <Link
              href="/messages"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-300 hover:bg-slate-800/70 hover:text-white"
              aria-label="Messages"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 px-1 text-[9px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}
          <UserMenu profile={profile} />
        </div>
      </Container>
    </header>
  );
}
