"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Library,
  Tag,
  Heart,
  Search,
  MessageCircle,
  Zap,
  Receipt,
  Settings,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/collection", label: "My collection", icon: Library },
  { href: "/listings", label: "Sale listings", icon: Tag },
  { href: "/offers", label: "Open to offers", icon: Heart },
  { href: "/buy-requests/mine", label: "Want list", icon: Search },
  { href: "/matches", label: "Matches", icon: Zap },
  { href: "/sales", label: "Sales", icon: Receipt },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-20 space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-brand-600/20 to-transparent text-brand-300 shadow-[inset_2px_0_0_0_#e63946]"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              )}
            >
              <Icon size={16} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
