import { cn } from "@/lib/utils";
import type { OripaTier } from "@prisma/client";

/**
 * Ichiban-kuji style tier badges. S = the chase, D = filler.
 * Colors mirror the reveal-animation aura convention:
 * S = rainbow/animated, A = gold, B = purple, C = blue, D = grey.
 */
const STYLES: Record<OripaTier, string> = {
  S: "border-transparent bg-gradient-to-r from-brand-500 via-gold-500 to-purple-500 text-white",
  A: "bg-gold-500/20 text-gold-500 border-gold-500/40",
  B: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  C: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  D: "bg-slate-700/50 text-slate-300 border-white/8",
};

export function TierBadge({ tier, className }: { tier: OripaTier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wider",
        STYLES[tier],
        className
      )}
    >
      {tier} PRIZE
    </span>
  );
}
