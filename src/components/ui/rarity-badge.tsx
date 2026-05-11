import { cn } from "@/lib/utils";

/**
 * One Piece TCG rarity codes — short and full versions.
 *  C   Common
 *  UC  Uncommon
 *  R   Rare
 *  SR  Super Rare
 *  SEC Secret Rare
 *  L   Leader
 *  SP  Special
 *  TR  Treasure Rare
 *  P   Promo
 */
const STYLES: Record<string, string> = {
  C: "bg-slate-700/60 text-slate-300 border-white/8",
  UC: "bg-success-500/15 text-success-500 border-success-500/30",
  R: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  SR: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  SEC: "bg-brand-600/25 text-brand-300 border-brand-500/40",
  L: "bg-gold-500/20 text-gold-500 border-gold-500/40",
  SP: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  TR: "bg-gradient-to-r from-gold-500/20 to-brand-500/20 text-gold-400 border-gold-500/40",
  P: "bg-pink-500/15 text-pink-300 border-pink-500/30",
};

export function RarityBadge({ rarity, className }: { rarity: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wider",
        STYLES[rarity] ?? "bg-slate-700/60 text-slate-300 border-white/8",
        className
      )}
    >
      {rarity}
    </span>
  );
}
