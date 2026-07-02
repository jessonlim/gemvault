"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import type { Game } from "@prisma/client";

type SetOption = { code: string; name: string };

interface Props {
  sets: SetOption[];
  game: Game;
  rarities: string[];
  cardTypes: string[];
  colors: string[];
}

export function CardFilters({ sets, game, rarities, cardTypes, colors }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const colorLabel = game === "POKEMON" ? "Type" : "Color";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => router.push(`/cards?${next.toString()}`));
  }

  function reset() {
    const next = new URLSearchParams();
    if (game !== "ONE_PIECE") next.set("game", game);
    startTransition(() => router.push(`/cards?${next.toString()}`));
  }

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get("q") as string).trim();
    update("q", q);
  }

  const activeCount = Array.from(params.keys()).filter(
    (k) => k !== "page" && k !== "q" && k !== "game"
  ).length;

  const advancedFilters = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <FilterSelect
          label="Set"
          value={params.get("setCode") ?? ""}
          onChange={(v) => update("setCode", v)}
          options={[
            { value: "", label: "All sets" },
            ...sets.map((s) => ({ value: s.code, label: `${s.code} — ${s.name}` })),
          ]}
        />
        <FilterSelect
          label="Rarity"
          value={params.get("rarity") ?? ""}
          onChange={(v) => update("rarity", v)}
          options={[{ value: "", label: "Any rarity" }, ...rarities.map((r) => ({ value: r, label: r }))]}
        />
        <FilterSelect
          label="Card type"
          value={params.get("cardType") ?? ""}
          onChange={(v) => update("cardType", v)}
          options={[{ value: "", label: "Any type" }, ...cardTypes.map((t) => ({ value: t, label: t }))]}
        />
        <FilterSelect
          label={colorLabel}
          value={params.get("color") ?? ""}
          onChange={(v) => update("color", v)}
          options={[{ value: "", label: `Any ${colorLabel.toLowerCase()}` }, ...colors.map((c) => ({ value: c, label: c }))]}
        />
      </div>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={reset} disabled={pending} className="w-full sm:w-auto">
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <form onSubmit={onSearchSubmit} className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder="Search by card name or code..."
          className="pl-9"
        />
      </form>

      <div className="sm:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => setDrawerOpen(true)}
          className="w-full justify-between"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={16} />
            Filters
          </span>
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-semibold text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      <div className="hidden sm:block">{advancedFilters}</div>

      <Sheet open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filters">
        {advancedFilters}
        <Button type="button" size="lg" className="mt-4 w-full" onClick={() => setDrawerOpen(false)}>
          Show results
        </Button>
      </Sheet>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
