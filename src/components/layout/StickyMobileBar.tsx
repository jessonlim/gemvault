import { cn } from "@/lib/utils";

/**
 * Sticky bottom bar visible only on mobile.
 * Sits above the tab bar (which is h-14), with safe-area padding.
 * Use for primary detail-page CTAs like "Contact seller" / "Add to collection".
 */
export function StickyMobileBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-14 z-20 border-t border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur sm:hidden",
        className
      )}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      {children}
    </div>
  );
}
