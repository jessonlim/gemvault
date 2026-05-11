import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "btn-vault-primary text-white",
        secondary:
          "bg-slate-800/80 text-white border border-white/5 hover:bg-slate-800 hover:border-brand-500/40",
        outline:
          "border border-brand-500/40 bg-transparent text-white hover:bg-brand-500/10 hover:border-brand-500/60",
        ghost: "text-slate-200 hover:bg-slate-800/70",
        danger:
          "bg-gradient-to-br from-red-600 to-red-800 text-white hover:from-red-500 hover:to-red-700 shadow-[0_8px_20px_-8px_rgba(220,38,38,0.5)]",
        gold:
          "bg-gradient-to-br from-gold-500 to-gold-600 text-slate-950 font-semibold hover:from-gold-400 hover:to-gold-500",
        link: "text-brand-400 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-xs sm:h-8",
        md: "h-11 px-5 text-sm sm:h-10",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-base",
        icon: "h-11 w-11 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
