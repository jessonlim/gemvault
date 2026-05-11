import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  seeAllHref?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, seeAllHref, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight text-slate-50 sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {seeAllHref ? (
        <Link
          href={seeAllHref}
          className="inline-flex items-center gap-0.5 text-sm font-medium text-brand-400 hover:text-brand-300"
        >
          See all <ChevronRight size={14} />
        </Link>
      ) : (
        action
      )}
    </div>
  );
}
