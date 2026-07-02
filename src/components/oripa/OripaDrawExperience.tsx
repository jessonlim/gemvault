"use client";

import { memo, useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GemLogo } from "@/components/ui/gem-logo";
import { TierBadge } from "@/components/oripa/TierBadge";
import { drawSlotAction, type DrawActionResult } from "@/app/(dashboard)/oripa/actions";
import { formatMyr, cn } from "@/lib/utils";
import { Shuffle, X, Sparkles, ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";
import type { OripaTier } from "@prisma/client";

interface SlotInfo {
  slotNumber: number;
  taken: boolean;
}

interface Props {
  seriesId: string;
  seriesTitle: string;
  slots: SlotInfo[];
  viewerCredits: number;
  isAuthed: boolean;
  pricePerDrawMyr: number;
  hostUsername: string;
  isActive: boolean;
}

type Phase =
  | { name: "idle" }
  | { name: "confirm"; slotNumber: number }
  | { name: "opening"; slotNumber: number }
  | { name: "reveal"; slotNumber: number; result: Extract<DrawActionResult, { ok: true }>["result"] };

const MIN_ANIMATION_MS = 2000;
/** Cap the carousel so a 300-pack series doesn't render 300 nodes — the grid covers the rest */
const CAROUSEL_MAX = 40;

export function OripaDrawExperience({
  seriesId,
  seriesTitle,
  slots,
  viewerCredits,
  isAuthed,
  pricePerDrawMyr,
  hostUsername,
  isActive,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  const available = useMemo(() => slots.filter((s) => !s.taken), [slots]);
  const carouselSlots = useMemo(() => available.slice(0, CAROUSEL_MAX), [available]);
  const canDraw = isAuthed && isActive && viewerCredits > 0;

  // ---- carousel centering ----
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const rafRef = useRef<number>();

  const activeIdxRef = useRef(0);

  const onRailScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rail = railRef.current;
      if (!rail) return;
      const center = rail.scrollLeft + rail.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < rail.children.length; i++) {
        const el = rail.children[i] as HTMLElement;
        const elCenter = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(elCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      activeIdxRef.current = best;
      setActiveIdx(best);
    });
  }, []);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const scrollToIdx = useCallback((idx: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const el = rail.children[Math.max(0, Math.min(idx, rail.children.length - 1))] as HTMLElement | undefined;
    if (!el) return;
    rail.scrollTo({
      left: el.offsetLeft + el.offsetWidth / 2 - rail.clientWidth / 2,
      behavior: "smooth",
    });
  }, []);

  const pickSlot = useCallback(
    (slotNumber: number) => {
      if (!canDraw) return;
      setError(null);
      setPhase({ name: "confirm", slotNumber });
    },
    [canDraw]
  );

  // Stable across scroll re-renders so memoized packs actually skip re-rendering
  const handlePackActivate = useCallback(
    (idx: number, slotNumber: number) => {
      if (idx === activeIdxRef.current) pickSlot(slotNumber);
      else scrollToIdx(idx);
    },
    [pickSlot, scrollToIdx]
  );

  function pickRandom() {
    if (!canDraw || available.length === 0) return;
    const random = available[Math.floor(Math.random() * available.length)];
    pickSlot(random.slotNumber);
  }

  async function confirmDraw(slotNumber: number) {
    setPhase({ name: "opening", slotNumber });
    setError(null);

    const [response] = await Promise.all([
      drawSlotAction(seriesId, slotNumber),
      new Promise((r) => setTimeout(r, MIN_ANIMATION_MS)),
    ]);

    if (!response.ok) {
      setError(response.error);
      setPhase({ name: "idle" });
      router.refresh();
      return;
    }

    setPhase({ name: "reveal", slotNumber, result: response.result });
  }

  function closeReveal() {
    setPhase({ name: "idle" });
    router.refresh();
  }

  const centeredSlot = carouselSlots[activeIdx];

  return (
    <div>
      {/* Credit status bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-4">
        {isAuthed ? (
          <>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Your draws</p>
              <p className="text-2xl font-bold text-slate-50">
                {viewerCredits}
                <span className="ml-1 text-sm font-normal text-slate-400">left</span>
              </p>
            </div>
            {viewerCredits === 0 && isActive && (
              <div className="text-sm text-slate-300">
                Pay {formatMyr(pricePerDrawMyr)}/draw to{" "}
                <Link href={`/profile/${hostUsername}`} className="font-semibold text-brand-400 hover:underline">
                  @{hostUsername}
                </Link>{" "}
                (message them) and they&apos;ll top you up.
              </div>
            )}
            {viewerCredits > 0 && (
              <Button onClick={pickRandom} variant="gold" size="sm" disabled={available.length === 0}>
                <Shuffle size={16} /> Random pick
              </Button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-slate-300">Log in to draw packs from this oripa.</p>
            <Link href="/login">
              <Button size="sm">Log in</Button>
            </Link>
          </>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-700/40 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* ===== Swipeable pack carousel ===== */}
      {available.length > 0 && (
        <div className="relative">
          {/* Desktop arrows */}
          <button
            type="button"
            aria-label="Previous pack"
            onClick={() => scrollToIdx(activeIdx - 1)}
            className="absolute -left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900/90 text-slate-300 hover:text-white sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next pack"
            onClick={() => scrollToIdx(activeIdx + 1)}
            className="absolute -right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900/90 text-slate-300 hover:text-white sm:flex"
          >
            <ChevronRight size={18} />
          </button>

          <div
            ref={railRef}
            onScroll={onRailScroll}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-[calc(50%-4.5rem)] py-6"
          >
            {carouselSlots.map((s, idx) => (
              <CarouselPack
                key={s.slotNumber}
                idx={idx}
                slotNumber={s.slotNumber}
                seriesTitle={seriesTitle}
                isCentered={idx === activeIdx}
                // Only packs near the center animate — 40 packs floating at
                // once keeps phone GPUs busy and makes taps feel laggy
                shouldFloat={Math.abs(idx - activeIdx) <= 2}
                floatAlt={idx % 2 === 1}
                glow={idx === activeIdx && canDraw}
                onActivate={handlePackActivate}
              />
            ))}
          </div>

          {/* CTA under carousel */}
          <div className="flex flex-col items-center gap-1">
            {centeredSlot && (
              <Button
                size="lg"
                disabled={!canDraw}
                onClick={() => pickSlot(centeredSlot.slotNumber)}
                className="min-w-[220px]"
              >
                <Sparkles size={18} />
                {canDraw
                  ? `Open pack #${centeredSlot.slotNumber}`
                  : isActive
                    ? "No draws left"
                    : "Sold out"}
              </Button>
            )}
            <p className="text-xs text-slate-500">
              Swipe to browse{available.length > CAROUSEL_MAX ? ` (first ${CAROUSEL_MAX} shown)` : ""} · {available.length} packs left
            </p>
          </div>
        </div>
      )}

      {/* ===== Collapsible number grid ===== */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setShowGrid((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200"
        >
          <Grid3X3 size={15} />
          {showGrid ? "Hide the full board" : "Pick by number — see the full board"}
        </button>

        {showGrid && (
          <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-10 md:grid-cols-12">
            {slots.map((s) => (
              <button
                key={s.slotNumber}
                type="button"
                disabled={s.taken || !canDraw}
                onClick={() => pickSlot(s.slotNumber)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg border text-[11px] font-bold transition-all",
                  s.taken
                    ? "border-white/5 bg-slate-900/40 text-slate-700 line-through"
                    : canDraw
                      ? "border-brand-500/40 bg-gradient-to-b from-brand-600/20 to-slate-900 text-brand-200 hover:scale-110 hover:border-brand-400"
                      : "border-white/8 bg-slate-900/70 text-slate-500"
                )}
              >
                {s.taken ? <X size={12} /> : s.slotNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirm sheet */}
      {phase.name === "confirm" && (
        <Modal onClose={() => setPhase({ name: "idle" })}>
          <div className="text-center">
            <div className="flex justify-center">
              <PackVisual title={seriesTitle} slotNumber={phase.slotNumber} size="modal" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-50">
              Draw pack #{phase.slotNumber}?
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              This uses 1 draw credit. No take-backs once opened!
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setPhase({ name: "idle" })}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => confirmDraw(phase.slotNumber)}>
                <Sparkles size={16} /> Open it!
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Opening animation */}
      {phase.name === "opening" && (
        <Modal>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="relative">
              <div className="oripa-aura oripa-aura-D absolute inset-[-24px]" />
              <div className="oripa-shake relative">
                <PackVisual title={seriesTitle} slotNumber={phase.slotNumber} size="modal" />
              </div>
            </div>
            <p className="mt-6 animate-pulse text-sm font-medium text-slate-300">
              Opening pack #{phase.slotNumber}...
            </p>
          </div>
        </Modal>
      )}

      {/* Reveal */}
      {phase.name === "reveal" && (
        <Modal>
          <RevealPanel
            result={phase.result}
            creditsAfter={viewerCredits - 1}
            onClose={closeReveal}
          />
        </Modal>
      )}
    </div>
  );
}

// ============== pieces ==============

/**
 * Memoized so scroll-driven activeIdx changes only re-render the packs whose
 * props actually changed (the old + new center and float window), not all 40.
 */
const CarouselPack = memo(function CarouselPack({
  idx,
  slotNumber,
  seriesTitle,
  isCentered,
  shouldFloat,
  floatAlt,
  glow,
  onActivate,
}: {
  idx: number;
  slotNumber: number;
  seriesTitle: string;
  isCentered: boolean;
  shouldFloat: boolean;
  floatAlt: boolean;
  glow: boolean;
  onActivate: (idx: number, slotNumber: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onActivate(idx, slotNumber)}
      className={cn(
        "snap-center transition-all duration-300",
        isCentered ? "scale-105" : "scale-90 opacity-60"
      )}
    >
      <div className={cn(shouldFloat && "oripa-float", shouldFloat && floatAlt && "oripa-float-delay")}>
        <PackVisual title={seriesTitle} slotNumber={slotNumber} glow={glow} size="carousel" />
      </div>
    </button>
  );
});

function Modal({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-white/8 bg-slate-900 p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function PackVisual({
  title,
  slotNumber,
  glow,
  size = "modal",
}: {
  title: string;
  slotNumber: number;
  glow?: boolean;
  size?: "carousel" | "modal";
}) {
  const dims = size === "carousel" ? "h-40 w-28 p-3" : "h-52 w-36 p-4";
  return (
    <div
      className={cn(
        "mx-auto flex flex-col items-center justify-between rounded-2xl border bg-gradient-to-b from-brand-700 via-brand-800 to-slate-950",
        dims,
        glow
          ? "border-brand-400/60 shadow-[0_0_32px_-4px_rgba(230,57,70,0.7)]"
          : "border-brand-500/30 shadow-[0_16px_48px_-12px_rgba(193,18,31,0.6)]"
      )}
    >
      <p className="line-clamp-2 text-center text-[9px] font-bold uppercase tracking-wider text-white/80">
        {title}
      </p>
      <GemLogo size={size === "carousel" ? 40 : 56} />
      <p className="rounded-full bg-slate-950/60 px-2.5 py-0.5 text-xs font-bold text-white">
        #{slotNumber}
      </p>
    </div>
  );
}

const TIER_REVEAL_COPY: Record<OripaTier, string> = {
  S: "🌈 GRAND PRIZE!!",
  A: "✨ MAJOR HIT!",
  B: "Nice pull!",
  C: "Not bad!",
  D: "Better luck next pack!",
};

function RevealPanel({
  result,
  creditsAfter,
  onClose,
}: {
  result: Extract<DrawActionResult, { ok: true }>["result"];
  creditsAfter: number;
  onClose: () => void;
}) {
  const { prize, lastOnePrize, slotNumber, remainingSlots } = result;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="oripa-flash pointer-events-none absolute inset-0 rounded-3xl bg-white" />

      <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
        Pack #{slotNumber}
      </p>

      <div className="relative mt-4">
        <div className={cn("oripa-aura absolute inset-[-28px]", `oripa-aura-${prize.tier}`)} />
        <div className="oripa-flip-in relative">
          {prize.imageUrl ? (
            <div className="relative h-64 w-44 overflow-hidden rounded-xl border border-white/15 bg-slate-800 shadow-2xl">
              <Image src={prize.imageUrl} alt={prize.name} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="flex h-64 w-44 items-center justify-center rounded-xl border border-white/15 bg-gradient-to-b from-slate-700 to-slate-900 shadow-2xl">
              <GemLogo size={64} />
            </div>
          )}
        </div>
      </div>

      <div className="oripa-rise mt-5">
        <p
          className={cn(
            "text-lg font-bold",
            prize.tier === "S"
              ? "bg-gradient-to-r from-brand-400 via-gold-500 to-purple-400 bg-clip-text text-transparent"
              : prize.tier === "A"
                ? "text-gold-500"
                : "text-slate-100"
          )}
        >
          {TIER_REVEAL_COPY[prize.tier]}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <TierBadge tier={prize.tier} />
          <p className="text-sm font-semibold text-slate-100">{prize.name}</p>
        </div>
        {prize.estValueMyr != null && (
          <p className="mt-1 text-xs text-slate-400">Est. value {formatMyr(prize.estValueMyr)}</p>
        )}

        {lastOnePrize && (
          <div className="mt-4 rounded-xl border border-gold-500/40 bg-gold-500/10 p-3">
            <p className="text-sm font-bold text-gold-500">🏆 LAST ONE BONUS!</p>
            <p className="mt-0.5 text-xs text-slate-200">
              You drew the final pack and also won: <span className="font-semibold">{lastOnePrize.name}</span>
            </p>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-500">
          The host will arrange delivery/handover. Track it under &ldquo;My pulls&rdquo; on this page.
        </p>

        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Done
          </Button>
          {creditsAfter > 0 && remainingSlots > 0 && (
            <Button className="flex-1" onClick={onClose}>
              Draw again ({creditsAfter} left)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
