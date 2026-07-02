import Link from "next/link";
import { listAllSeriesAdmin } from "@/services/oripa";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMyr, timeAgo } from "@/lib/utils";
import { Plus, Gift } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "brand" | "gold" | "success" | "danger" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "outline" },
  ACTIVE: { label: "Live", variant: "success" },
  SOLD_OUT: { label: "Sold out", variant: "gold" },
  ARCHIVED: { label: "Archived", variant: "default" },
};

export default async function AdminOripaListPage() {
  const series = await listAllSeriesAdmin();

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">Oripa series</h1>
          <p className="mt-1 text-sm text-slate-400">Create and manage gacha pack series.</p>
        </div>
        <Link href="/admin/oripa/new">
          <Button>
            <Plus size={16} /> New series
          </Button>
        </Link>
      </div>

      {series.length === 0 ? (
        <EmptyState
          icon={<Gift size={28} />}
          title="No oripa series yet"
          description="Create your first series, add prizes by tier, then activate it."
          action={
            <Link href="/admin/oripa/new">
              <Button>Create series</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {series.map((s) => {
            const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.DRAFT;
            return (
              <Link key={s.id} href={`/admin/oripa/${s.id}`} className="block">
                <Card className="card-lift">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-100">{s.title}</p>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatMyr(s.pricePerDrawMyr)}/draw · {s._count.prizes} prize line{s._count.prizes === 1 ? "" : "s"}
                        {s.status !== "DRAFT" && ` · ${s._count.slots} packs`}
                        {" · "}created {timeAgo(s.createdAt)} by @{s.createdBy.username}
                      </p>
                    </div>
                    <span className="text-sm text-brand-400">Manage →</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
