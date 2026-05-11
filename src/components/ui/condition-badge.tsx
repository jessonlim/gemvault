import { cn } from "@/lib/utils";
import type { CardCondition } from "@prisma/client";

const SHORT: Record<CardCondition, string> = {
  MINT: "M",
  NEAR_MINT: "NM",
  EXCELLENT: "EX",
  GOOD: "GD",
  PLAYED: "LP",
  POOR: "DMG",
};

const FULL: Record<CardCondition, string> = {
  MINT: "Mint",
  NEAR_MINT: "Near Mint",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  PLAYED: "Played",
  POOR: "Poor",
};

const STYLES: Record<CardCondition, string> = {
  MINT: "bg-success-500/15 text-success-500 border-success-500/30",
  NEAR_MINT: "bg-success-500/15 text-success-500 border-success-500/30",
  EXCELLENT: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  GOOD: "bg-gold-500/15 text-gold-500 border-gold-500/30",
  PLAYED: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  POOR: "bg-red-600/15 text-red-300 border-red-500/40",
};

export function ConditionBadge({
  condition,
  full = false,
  className,
}: {
  condition: CardCondition;
  full?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
        STYLES[condition],
        className
      )}
    >
      {full ? FULL[condition] : SHORT[condition]}
    </span>
  );
}
