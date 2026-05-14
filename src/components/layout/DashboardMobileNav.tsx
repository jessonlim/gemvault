"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview" },
  { href: "/collection", label: "Collection" },
  { href: "/listings", label: "Listings" },
  { href: "/offers", label: "Offers" },
  { href: "/buy-requests/mine", label: "Want list" },
  { href: "/matches", label: "Matches" },
  { href: "/sales", label: "Sales" },
  { href: "/messages", label: "Messages" },
  { href: "/settings", label: "Settings" },
];

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 mb-4 overflow-x-auto no-scrollbar border-b border-white/5 px-4 lg:hidden">
      <ul className="flex gap-1 whitespace-nowrap">
        {items.map(({ href, label }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "inline-flex h-10 items-center border-b-2 px-3 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-500 text-brand-300"
                    : "border-transparent text-slate-400 hover:text-slate-100"
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
