import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-tight",
  {
    variants: {
      variant: {
        default: "bg-slate-800/80 text-slate-200 border border-white/5",
        brand: "bg-brand-600/20 text-brand-300 border border-brand-500/40",
        gold: "bg-gold-500/15 text-gold-500 border border-gold-500/30",
        success: "bg-success-500/15 text-success-500 border border-success-500/30",
        warning: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
        danger: "bg-red-600/15 text-red-300 border border-red-500/40",
        outline: "border border-white/10 text-slate-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
