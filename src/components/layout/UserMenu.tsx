"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import type { Profile } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { LogOut, User, LayoutDashboard, ShieldCheck, Settings, Library, Tag } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";

export function UserMenu({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false);

  if (!profile) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">Log in</Button>
        </Link>
        <Link href="/register">
          <Button size="sm">Sign up</Button>
        </Link>
      </div>
    );
  }

  const initial = (profile.displayName || profile.username).charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-[0_4px_12px_-4px_rgba(193,18,31,0.5)] hover:brightness-110"
        aria-label="Open user menu"
      >
        {profile.avatarUrl ? (
          <Image src={profile.avatarUrl} alt="" width={36} height={36} className="h-full w-full object-cover" unoptimized />
        ) : (
          initial
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-white/5 bg-slate-900 shadow-2xl">
            <div className="border-b border-white/5 px-4 py-3">
              <p className="text-sm font-semibold text-slate-100">{profile.displayName || profile.username}</p>
              <p className="truncate text-xs text-slate-400">@{profile.username}</p>
            </div>
            <div className="py-1">
              <MenuLink href="/dashboard" icon={<LayoutDashboard size={16} />} onClick={() => setOpen(false)}>
                Dashboard
              </MenuLink>
              <MenuLink href="/collection" icon={<Library size={16} />} onClick={() => setOpen(false)}>
                My Collection
              </MenuLink>
              <MenuLink href="/listings" icon={<Tag size={16} />} onClick={() => setOpen(false)}>
                My Listings
              </MenuLink>
              <MenuLink href={`/profile/${profile.username}`} icon={<User size={16} />} onClick={() => setOpen(false)}>
                Public profile
              </MenuLink>
              <MenuLink href="/settings" icon={<Settings size={16} />} onClick={() => setOpen(false)}>
                Settings
              </MenuLink>
              {(profile.role === "ADMIN" || profile.role === "MODERATOR") && (
                <MenuLink href="/admin" icon={<ShieldCheck size={16} />} onClick={() => setOpen(false)}>
                  Admin
                </MenuLink>
              )}
            </div>
            <form action={signOutAction} className="border-t border-white/5">
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
              >
                <LogOut size={16} /> Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
    >
      {icon}
      {children}
    </Link>
  );
}
