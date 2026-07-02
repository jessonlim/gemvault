import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { GemLogo } from "@/components/ui/gem-logo";
import { TierBadge } from "@/components/oripa/TierBadge";
import { listPublicSeries } from "@/services/oripa";
import { GAME_LABELS } from "@/services/cards";
import { formatMyr } from "@/lib/utils";
import { Gift } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OripaListPage() {
  const series = await listPublicSeries();

  return (
    <Container className="py-6 pb-24 sm:py-10 sm:pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          <Gift size={24} className="-mt-1 mr-1.5 inline text-brand-400" />
          Oripa Packs
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Japanese-style original packs. Every series has a fixed, public prize pool —
          what you see is exactly what&apos;s inside, and the pool never changes after launch.
        </p>
      </div>

      {series.length === 0 ? (
        <EmptyState
          icon={<Gift size={28} />}
          title="No oripa series live right now"
          description="Check back soon — new series drop regularly."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => {
            const soldOut = s.status === "SOLD_OUT";
            const pct = s.totalSlots > 0 ? (s.remainingSlots / s.totalSlots) * 100 : 0;
            return (
              <Link key={s.id} href={`/oripa/${s.id}`}>
                <Card className={`card-lift h-full overflow-hidden p-0 ${soldOut ? "opacity-60" : ""}`}>
                  {/* Cover */}
                  <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-brand-800 via-slate-900 to-slate-950">
                    {s.coverImageUrl ? (
                      <Image src={s.coverImageUrl} alt={s.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <GemLogo size={48} />
                      </div>
                    )}
                    <div className="absolute right-2 top-2 flex gap-1">
                      {s.game && <Badge variant="outline">{GAME_LABELS[s.game]}</Badge>}
                      {soldOut ? (
                        <Badge variant="gold">Sold out</Badge>
                      ) : (
                        s.remainingSlots <= Math.max(3, s.totalSlots * 0.1) && (
                          <Badge variant="danger">Almost gone!</Badge>
                        )
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <p className="line-clamp-1 font-semibold text-slate-100">{s.title}</p>
                    {s.topPrize && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <TierBadge tier={s.topPrize.tier} />
                        <p className="line-clamp-1 text-xs text-slate-400">{s.topPrize.name}</p>
                      </div>
                    )}

                    {/* Remaining bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">
                          {s.remainingSlots}/{s.totalSlots} packs left
                        </span>
                        <span className="font-bold text-brand-400">
                          {formatMyr(s.pricePerDrawMyr)}/draw
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
