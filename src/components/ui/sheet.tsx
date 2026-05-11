"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Where the sheet slides in from on mobile. Default: bottom */
  side?: "bottom" | "right";
}

/**
 * Mobile-first slide-up sheet (bottom drawer).
 * On larger screens (sm+) renders as a centered modal.
 */
export function Sheet({ open, onClose, title, children, side = "bottom" }: SheetProps) {
  // Lock body scroll while open
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center" role="dialog">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative ml-auto w-full bg-slate-900 shadow-xl",
          side === "bottom"
            ? "mt-auto max-h-[85vh] rounded-t-2xl sm:m-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl"
            : "h-full max-w-sm sm:max-w-md"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Drag handle for bottom sheets on mobile */}
        {side === "bottom" && (
          <div className="flex justify-center pt-2 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-slate-700" />
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: "calc(85vh - 56px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
