import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Display-only star rating (read-only, used on profiles, listings).
 */
export function StarRating({
  value,
  count,
  size = 14,
  className,
}: {
  value: number | null | undefined;
  count?: number;
  size?: number;
  className?: string;
}) {
  if (value == null) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-slate-500", className)}>
        <Star size={size} className="text-slate-700" /> No ratings yet
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", className)}>
      <Star size={size} className="fill-gold-500 text-gold-500" strokeWidth={1.5} />
      <span className="font-semibold text-slate-100">{value.toFixed(1)}</span>
      {count != null && <span className="text-slate-500">({count})</span>}
    </span>
  );
}
