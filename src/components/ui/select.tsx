import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-11 w-full appearance-none rounded-xl border border-white/8 bg-slate-900/70 px-4 py-2 text-base text-slate-100 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 sm:h-10 sm:text-sm",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
