"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { CARD_TYPES, COLORS, RARITIES } from "@/services/cards";
import { CONDITION_LABELS, LANGUAGE_LABELS } from "@/lib/utils";

type SetOption = { code: string; name: string };

interface Props {
  sets: SetOption[];
  basePath: string;
  hidePrice?: boolean;
}

export function MarketplaceFilters({ sets, basePath, hidePrice }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    next.delete("page");
    startTransition(() => router.push(`${basePath}?${next.toString()}`));
  }

  function reset() {
    startTransition(() => router.push(basePath));
  }

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    update({ q: ((fd.get("q") as string) ?? "").trim() || undefined });
  }

  function onPriceSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    update({
      minPrice: ((fd.get("minPrice") as string) ?? "").trim() || undefined,
      maxPrice: ((fd.get("maxPrice") as string) ?? "").trim() || undefined,
    });
  }

  const activeCount = Array.from(params.keys()).filter(
    (k) => k !== "page" && k !== "q"
  ).length;

  // The advanced filters block (reused inline on desktop and inside the drawer on mobile)
  const advancedFilters = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <FilterSelect
          label="Set"
          value={params.get("setCode") ?? ""}
          onChange={(v) => update({ setCode: v })}
          options={[{ value: "", label: "All sets" }, ...sets.map((s) => ({ value: s.code, label: `${s.code} — ${s.name}` }))]}
        />
        <FilterSelect
          label="Rarity"
          value={params.get("rarity") ?? ""}
          onChange={(v) => update({ rarity: v })}
          options={[{ value: "", label: "Any rarity" }, ...RARITIES.map((r) => ({ value: r, label: r }))]}
        />
        <FilterSelect
          label="Type"
          value={params.get("cardType") ?? ""}
          onChange={(v) => update({ cardType: v })}
          options={[{ value: "", label: "Any type" }, ...CARD_TYPES.map((t) => ({ value: t, label: t }))]}
        />
        <FilterSelect
          label="Color"
          value={params.get("color") ?? ""}
          onChange={(v) => update({ color: v })}
          options={[{ value: "", label: "Any color" }, ...COLORS.map((c) => ({ value: c, label: c }))]}
        />
        <FilterSelect
          label="Condition"
          value={params.get("condition") ?? ""}
          onChange={(v) => update({ condition: v })}
          options={[
            { value: "", label: "Any condition" },
            ...Object.entries(CONDITION_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]}
        />
        <FilterSelect
          label="Language"
          value={params.get("language") ?? ""}
          onChange={(v) => update({ language: v })}
          options={[
            { value: "", label: "Any language" },
            ...Object.entries(LANGUAGE_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]}
        />
      </div>

      <div className="space-y-1.5">
        <Label>City</Label>
        <Input
          placeholder="e.g. Kuala Lumpur"
          defaultValue={params.get("city") ?? ""}
          onBlur={(e) => update({ city: e.target.value.trim() || undefined })}
        />
      </div>

      {!hidePrice && (
        <form onSubmit={onPriceSubmit} className="space-y-1.5">
          <Label>Price range (RM)</Label>
          <div className="flex gap-2">
            <Input
              name="minPrice"
              type="number"
              min={0}
              step="0.01"
              placeholder="Min"
              defaultValue={params.get("minPrice") ?? ""}
            />
            <Input
              name="maxPrice"
              type="number"
              min={0}
              step="0.01"
              placeholder="Max"
              defaultValue={params.get("maxPrice") ?? ""}
            />
            <Button type="submit" variant="outline" disabled={pending}>
              Apply
            </Button>
          </div>
        </form>
      )}

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={reset} disabled={pending} className="w-full sm:w-auto">
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Search (always visible) */}
      <form onSubmit={onSearchSubmit} className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder="Search by card name or code..."
          className="pl-9"
        />
      </form>

      {/* Mobile: Filters button → opens drawer */}
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

      {/* Desktop: inline */}
      <div className="hidden sm:block">{advancedFilters}</div>

      {/* Mobile: drawer mounts the same UI when open */}
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
      <Select value={value} onChange={(e) => onChange(e.target.value || undefined as unknown as string)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
