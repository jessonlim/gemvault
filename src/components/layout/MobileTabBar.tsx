"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Store, Zap, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
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
  {
    href: "/marketplace",
    label: "Market",
    icon: Store,
    match: (p: string) =>
      p === "/marketplace" || p.startsWith("/marketplace/") || p === "/cards" || p.startsWith("/cards/"),
  },
  {
    href: "/matches",
    label: "Matches",
    icon: Zap,
    match: (p: string) => p.startsWith("/matches"),
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
      p.startsWith("/settings"),
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-slate-950/95 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex h-16 items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
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
                <span className={cn(active && "font-semibold")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
