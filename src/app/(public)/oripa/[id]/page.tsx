import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GemLogo } from "@/components/ui/gem-logo";
import { TierBadge } from "@/components/oripa/TierBadge";
import { OripaDrawExperience } from "@/components/oripa/OripaDrawExperience";
import { getSeriesDetail } from "@/services/oripa";
import { getCurrentProfile } from "@/lib/auth";
import { GAME_LABELS } from "@/services/cards";
import { formatMyr } from "@/lib/utils";
import { ShieldCheck, Trophy, PackageCheck, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OripaDetailPage({ params }: { params: { id: string } }) {
  const viewer = await getCurrentProfile();
  const detail = await getSeriesDetail(params.id, viewer?.id);
  if (!detail) notFound();

  const { series, tiers, lastOnePrize, remainingSlots, slots, viewerCredits, viewerDraws } = detail;
  const soldOut = series.status === "SOLD_OUT";

  return (
    <Container className="py-6 pb-24 sm:py-10 sm:pb-10">
      <Link href="/oripa" className="text-sm text-brand-400 hover:underline">
        ← All oripa
      </Link>

      {/* Header */}
      <div className="mt-4 overflow-hidden rounded-3xl border border-white/5 bg-vault-gradient">
        <div className="grid gap-4 p-5 sm:p-8 lg:grid-cols-[1fr_260px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {series.game && <Badge variant="outline">{GAME_LABELS[series.game]}</Badge>}
              {soldOut ? (
                <Badge variant="gold">Sold out</Badge>
              ) : (
                <Badge variant="success">Live</Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
              {series.title}
            </h1>
            {series.description && (
              <p className="mt-2 max-w-xl whitespace-pre-line text-sm text-slate-300">
                {series.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-2xl font-bold text-brand-400">
                {formatMyr(series.pricePerDrawMyr)}
                <span className="text-sm font-normal text-slate-400">/draw</span>
              </span>
              <span className="font-semibold text-slate-100">
                {remainingSlots}/{series.totalSlots} packs left
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                Hosted by{" "}
                <Link href={`/profile/${series.createdBy.username}`} className="font-medium text-brand-400 hover:underline">
                  @{series.createdBy.username}
                </Link>
                {series.createdBy.verificationStatus === "VERIFIED" && (
                  <ShieldCheck size={12} className="text-emerald-400" />
                )}
              </span>
            </div>
          </div>
          {series.coverImageUrl && (
            <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 lg:block">
              <Image src={series.coverImageUrl} alt="" fill className="object-cover" unoptimized />
            </div>
          )}
        </div>
      </div>

      {/* Last one prize banner */}
      {lastOnePrize && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-4">
          {lastOnePrize.imageUrl ? (
            <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md">
              <Image src={lastOnePrize.imageUrl} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <Trophy size={24} className="flex-shrink-0 text-gold-500" />
          )}
          <div>
            <p className="text-sm font-bold text-gold-500">🏆 LAST ONE PRIZE</p>
            <p className="text-sm text-slate-200">
              {lastOnePrize.name}
              {lastOnePrize.estValueMyr != null && (
                <span className="text-slate-400"> · est. {formatMyr(lastOnePrize.estValueMyr)}</span>
              )}
            </p>
            <p className="text-xs text-slate-400">
              Whoever draws the final pack wins this on top of their pull.
              {series.lastOneWinner && (
                <span className="font-semibold text-gold-500"> Won by @{series.lastOneWinner.username}!</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Prize pool — full transparency */}
      <section className="mt-8">
        <h2 className="text-lg font-bold tracking-tight text-slate-50">Prize pool</h2>
        <p className="text-sm text-slate-400">
          Fixed at launch and never edited. Counts show remaining / original.
        </p>
        <div className="mt-3 space-y-4">
          {tiers.map((tier) => (
            <div key={tier.tier}>
              <div className="mb-2 flex items-center gap-2">
                <TierBadge tier={tier.tier} />
                <span className="text-xs font-semibold text-slate-300">
                  {tier.remaining}/{tier.total} remaining
                </span>
                {tier.remaining === 0 && (
                  <Badge variant="danger" className="text-[10px]">All pulled</Badge>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tier.prizes.map((p) => (
                  <Card key={p.id} className={p.remaining === 0 ? "opacity-50" : ""}>
                    <CardContent className="flex items-center gap-3 p-3">
                      {p.imageUrl ? (
                        <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded-md bg-slate-800">
                          <Image src={p.imageUrl} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="flex h-14 w-10 flex-shrink-0 items-center justify-center rounded-md bg-slate-800">
                          <GemLogo size={16} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-slate-100">{p.name}</p>
                        <p className="text-xs text-slate-400">
                          {p.remaining}/{p.total} left
                          {p.estValueMyr != null && ` · est. ${formatMyr(p.estValueMyr)}`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pick your pack */}
      <section className="mt-8">
        <h2 className="text-lg font-bold tracking-tight text-slate-50">Pick your pack</h2>
        <p className="mb-4 text-sm text-slate-400">
          {soldOut
            ? "This series is sold out — every pack has been drawn."
            : "Tap an available pack to draw it, or let fate decide with a random pick."}
        </p>
        <OripaDrawExperience
          seriesId={series.id}
          seriesTitle={series.title}
          slots={slots}
          viewerCredits={viewerCredits}
          isAuthed={!!viewer}
          pricePerDrawMyr={series.pricePerDrawMyr}
          hostUsername={series.createdBy.username}
          isActive={series.status === "ACTIVE"}
        />
      </section>

      {/* My pulls */}
      {viewerDraws.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold tracking-tight text-slate-50">My pulls</h2>
          <p className="text-sm text-slate-400">
            The host will contact you (or message them) to arrange shipping/handover.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {viewerDraws.map((d) => (
              <Card key={d.slotNumber}>
                <CardContent className="flex items-center gap-3 p-3">
                  {d.imageUrl ? (
                    <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded-md bg-slate-800">
                      <Image src={d.imageUrl} alt="" fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="flex h-14 w-10 flex-shrink-0 items-center justify-center rounded-md bg-slate-800">
                      <GemLogo size={16} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <TierBadge tier={d.tier} />
                      <p className="line-clamp-1 text-sm font-medium text-slate-100">{d.prizeName}</p>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      Pack #{d.slotNumber} ·{" "}
                      {d.fulfilled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <PackageCheck size={12} /> Fulfilled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <Package size={12} /> Pending delivery
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
