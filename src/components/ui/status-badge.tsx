import { cn } from "@/lib/utils";
import type { SellMode, ListingStatus, BuyRequestStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: SellMode | ListingStatus | BuyRequestStatus | "MATCHED";
  className?: string;
}

const STYLES: Record<string, string> = {
  // Sell modes
  COLLECTION: "bg-slate-700/50 text-slate-300 border-white/8",
  OPEN_TO_OFFERS: "bg-gold-500/15 text-gold-500 border-gold-500/30",
  LISTED_FOR_SALE: "bg-brand-600/25 text-brand-300 border-brand-500/40",
  // Listing statuses
  ACTIVE: "bg-success-500/15 text-success-500 border-success-500/30",
  RESERVED: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  SOLD: "bg-slate-700/50 text-slate-400 border-white/8",
  CANCELLED: "bg-red-600/15 text-red-300 border-red-500/30",
  EXPIRED: "bg-slate-700/50 text-slate-500 border-white/8",
  // Buy request
  FULFILLED: "bg-success-500/15 text-success-500 border-success-500/30",
  // Custom
  MATCHED: "bg-brand-600/25 text-brand-300 border-brand-500/40",
};

const LABELS: Record<string, string> = {
  COLLECTION: "Collection",
  OPEN_TO_OFFERS: "For Offer",
  LISTED_FOR_SALE: "For Sale",
  ACTIVE: "Active",
  RESERVED: "Reserved",
  SOLD: "Sold",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  FULFILLED: "Fulfilled",
  MATCHED: "Matched",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight",
        STYLES[status] ?? "bg-slate-800 text-slate-300 border-white/8",
        className
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
