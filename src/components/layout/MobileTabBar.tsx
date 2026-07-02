"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Store, User, type LucideIcon } from "lucide-react";
import { GemLogo } from "@/components/ui/gem-logo";
import { cn } from "@/lib/utils";

const leftTabs = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    match: (p: string) => p === "/" || p === "/dashboard",
  },
  {
    href: "/collection",
    label: "Collection",
    icon: Library,
    match: (p: string) => p.startsWith("/collection"),
  },
];

const rightTabs = [
  {
    href: "/marketplace",
    label: "Market",
    icon: Store,
    match: (p: string) =>
      p === "/marketplace" || p.startsWith("/marketplace/") || p === "/cards" || p.startsWith("/cards/"),
  },
  {
    href: "/me",
    label: "Profile",
    icon: User,
    match: (p: string) =>
      p === "/me" ||
      p.startsWith("/profile") ||
      p.startsWith("/listings") ||
      p.startsWith("/offers") ||
      p.startsWith("/buy-requests") ||
      p.startsWith("/matches") ||
      p.startsWith("/settings"),
  },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const oripaActive = pathname.startsWith("/oripa");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-slate-950/95 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex h-16 items-stretch justify-around">
        {leftTabs.map((tab) => (
          <TabItem key={tab.href} tab={tab} pathname={pathname} />
        ))}

        {/* Oripa — the main event: raised gem button in the center */}
        <li className="flex-1">
          <Link
            href="/oripa"
            className="relative flex h-full flex-col items-center justify-end pb-1.5"
          >
            <span
              className={cn(
                "absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full border transition-all",
                oripaActive
                  ? "border-brand-400/60 bg-gradient-to-b from-brand-500 to-brand-800 shadow-[0_0_24px_-2px_rgba(230,57,70,0.8)]"
                  : "border-brand-500/40 bg-gradient-to-b from-brand-600 to-brand-900 shadow-[0_8px_24px_-6px_rgba(193,18,31,0.7)]"
              )}
            >
              <GemLogo size={30} />
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold",
                oripaActive ? "text-brand-400" : "text-slate-400"
              )}
            >
              Oripa
            </span>
          </Link>
        </li>

        {rightTabs.map((tab) => (
          <TabItem key={tab.href} tab={tab} pathname={pathname} />
        ))}
      </ul>
    </nav>
  );
}

function TabItem({
  tab,
  pathname,
}: {
  tab: { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean };
  pathname: string;
}) {
  const active = tab.match(pathname);
  const Icon = tab.icon;
  return (
    <li className="flex-1">
      <Link
        href={tab.href}
        className={cn(
          "relative flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
          active ? "text-brand-400" : "text-slate-500 active:text-slate-200"
        )}
      >
        {active && (
          <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-gradient-to-r from-brand-500 to-brand-700" />
        )}
        <Icon
          size={22}
          strokeWidth={active ? 2.4 : 1.8}
          className={cn(active && "drop-shadow-[0_0_8px_rgba(230,57,70,0.6)]")}
        />
        <span className={cn(active && "font-semibold")}>{tab.label}</span>
      </Link>
    </li>
  );
}
