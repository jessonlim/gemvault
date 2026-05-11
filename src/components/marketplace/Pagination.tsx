import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}

export function Pagination({ page, totalPages, basePath, searchParams }: Props) {
  if (totalPages <= 1) return null;

  function buildHref(p: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== "page") params.set(k, v);
    });
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Link href={buildHref(Math.max(1, page - 1))}>
        <Button variant="outline" size="sm" disabled={page <= 1}>Prev</Button>
      </Link>
      <span className="text-sm text-slate-400">
        Page {page} of {totalPages}
      </span>
      <Link href={buildHref(Math.min(totalPages, page + 1))}>
        <Button variant="outline" size="sm" disabled={page >= totalPages}>Next</Button>
      </Link>
    </div>
  );
}
