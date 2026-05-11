"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

export function NavbarSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/cards?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={submit} className="relative w-full">
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
      />
      <input
        type="text"
        placeholder="Search for cards, sets, or collectors..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-10 w-full rounded-full border border-white/8 bg-slate-900/70 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </form>
  );
}
