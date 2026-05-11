import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[88px] w-full rounded-xl border border-white/8 bg-slate-900/70 px-4 py-2 text-base text-slate-100 placeholder:text-slate-500 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 sm:min-h-[80px] sm:text-sm",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
