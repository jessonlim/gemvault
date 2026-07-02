import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getSeriesAdmin } from "@/services/oripa";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMyr, timeAgo } from "@/lib/utils";
import { AddPrizeForm } from "./add-prize-form";
import { GrantCreditsForm } from "./grant-credits-form";
import { SeriesControls, RemovePrizeButton, FulfillToggle } from "./series-controls";
import { TierBadge } from "@/components/oripa/TierBadge";

export const dynamic = "force-dynamic";

export default async function AdminOripaDetailPage({ params }: { params: { id: string } }) {
  const series = await getSeriesAdmin(params.id);
  if (!series) notFound();

  const poolPrizes = series.prizes.filter((p) => !p.isLastOne);
  const lastOnePrize = series.prizes.find((p) => p.isLastOne);
  const totalPacks = poolPrizes.reduce((a, p) => a + p.quantity, 0);
  const drawnCount = series.slots.length;

  return (
    <div>
      <Link href="/admin/oripa" className="text-sm text-brand-400 hover:underline">
        ← All series
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">{series.title}</h1>
            <Badge
              variant={
                series.status === "ACTIVE" ? "success"
                : series.status === "SOLD_OUT" ? "gold"
                : series.status === "DRAFT" ? "outline"
                : "default"
              }
            >
              {series.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {formatMyr(series.pricePerDrawMyr)}/draw
            {series.status === "DRAFT"
              ? ` · ${totalPacks} packs when activated`
              : ` · ${series.totalSlots - drawnCount}/${series.totalSlots} packs left`}
          </p>
          {series.status !== "DRAFT" && (
            <p className="mt-1 text-xs text-slate-500">
              Public page:{" "}
              <Link href={`/oripa/${series.id}`} className="text-brand-400 hover:underline">
                /oripa/{series.id}
              </Link>
            </p>
          )}
        </div>
        <SeriesControls
          seriesId={series.id}
          status={series.status}
          totalPacks={totalPacks}
        />
      </div>

      {/* Prize pool */}
      <section className="mt-8">
        <h2 className="text-lg font-bold tracking-tight text-slate-50">Prize pool</h2>
        <p className="text-sm text-slate-400">
          {series.status === "DRAFT"
            ? "Add prizes below. Once activated, the pool is locked — no edits (that's the trust promise to buyers)."
            : "Pool is locked. Quantities shown are the original pool composition."}
        </p>

        {series.prizes.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-white/8 p-6 text-center text-sm text-slate-500">
            No prizes yet — add your first below.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {series.prizes.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  {(p.imageUrl ?? p.card?.imageUrl) ? (
                    <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md bg-slate-800">
                      <Image
                        src={(p.imageUrl ?? p.card?.imageUrl)!}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-12 flex-shrink-0 items-center justify-center rounded-md bg-slate-800 text-[10px] text-slate-500">
                      No img
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.isLastOne ? (
                        <Badge variant="gold">LAST ONE</Badge>
                      ) : (
                        <TierBadge tier={p.tier} />
                      )}
                      <p className="text-sm font-semibold text-slate-100">{p.name}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {p.isLastOne ? "Bonus for the final draw" : `×${p.quantity} in pool`}
                      {p.card?.cardCode && ` · ${p.card.cardCode}`}
                      {p.estValueMyr != null && ` · est. ${formatMyr(p.estValueMyr)}`}
                    </p>
                  </div>
                  {series.status === "DRAFT" && (
                    <RemovePrizeButton prizeId={p.id} seriesId={series.id} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {series.status === "DRAFT" && (
          <Card className="mt-4">
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Add prize
              </h3>
              <AddPrizeForm seriesId={series.id} />
            </CardContent>
          </Card>
        )}
      </section>

      {series.status !== "DRAFT" && (
        <>
          {/* Credits */}
          <section className="mt-8">
            <h2 className="text-lg font-bold tracking-tight text-slate-50">Draw credits</h2>
            <p className="text-sm text-slate-400">
              Grant draws after receiving payment (bank transfer / TnG / cash). 1 credit = 1 pack.
            </p>
            <Card className="mt-3">
              <CardContent className="p-5">
                <GrantCreditsForm seriesId={series.id} />
              </CardContent>
            </Card>
            {series.credits.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-3 text-left font-medium">User</th>
                      <th className="p-3 text-right font-medium">Draws left</th>
                      <th className="p-3 text-right font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {series.credits.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3 text-slate-100">@{c.user.username}</td>
                        <td className="p-3 text-right font-semibold text-slate-100">{c.credits}</td>
                        <td className="p-3 text-right text-xs text-slate-500">{timeAgo(c.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Draw history + fulfillment */}
          <section className="mt-8">
            <h2 className="text-lg font-bold tracking-tight text-slate-50">
              Draws ({drawnCount})
            </h2>
            <p className="text-sm text-slate-400">
              Mark each prize fulfilled once shipped or handed over.
            </p>
            {series.slots.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-white/8 p-6 text-center text-sm text-slate-500">
                No draws yet.
              </div>
            ) : (
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-3 text-left font-medium">Pack</th>
                      <th className="p-3 text-left font-medium">Prize</th>
                      <th className="p-3 text-left font-medium">Winner</th>
                      <th className="hidden p-3 text-left font-medium sm:table-cell">When</th>
                      <th className="p-3 text-right font-medium">Fulfilled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {series.slots.map((s) => (
                      <tr key={s.id}>
                        <td className="p-3 font-mono text-slate-300">#{s.slotNumber}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <TierBadge tier={s.prize.tier} />
                            <span className="text-slate-100">{s.prize.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">@{s.drawnBy?.username}</td>
                        <td className="hidden p-3 text-xs text-slate-500 sm:table-cell">
                          {s.drawnAt ? timeAgo(s.drawnAt) : "—"}
                        </td>
                        <td className="p-3 text-right">
                          <FulfillToggle slotId={s.id} seriesId={series.id} fulfilled={s.fulfilled} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {lastOnePrize && series.lastOneWinner && (
        <div className="mt-6 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-4 text-sm text-gold-500">
          🏆 Last One prize ({lastOnePrize.name}) won by @{series.lastOneWinner.username}
        </div>
      )}
    </div>
  );
}
