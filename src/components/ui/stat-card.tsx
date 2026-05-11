import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  href?: string;
  /** Premium accent (red border glow) */
  accent?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  href,
  accent,
  className,
}: StatCardProps) {
  const inner = (
    <div
      className={cn(
        "surface-glass relative overflow-hidden rounded-2xl p-4 transition-all sm:p-5",
        accent && "border-brand-500/30 bg-brand-600/5",
        href && "card-lift cursor-pointer",
        className
      )}
    >
      {accent && (
        <div className="bg-red-glow pointer-events-none absolute -right-12 -top-12 h-32 w-32" />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
            {value}
          </p>
          {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.positive ? "text-success-500" : "text-red-300"
              )}
            >
              {trend.positive ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
              accent
                ? "bg-brand-500/20 text-brand-300"
                : "bg-slate-800/80 text-slate-400"
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
