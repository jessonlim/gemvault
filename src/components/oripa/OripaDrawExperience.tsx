"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GemLogo } from "@/components/ui/gem-logo";
import { TierBadge } from "@/components/oripa/TierBadge";
import { drawSlotAction, type DrawActionResult } from "@/app/(dashboard)/oripa/actions";
import { formatMyr, cn } from "@/lib/utils";
import { Shuffle, X, Sparkles } from "lucide-react";
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

  const available = useMemo(() => slots.filter((s) => !s.taken), [slots]);
  const canDraw = isAuthed && isActive && viewerCredits > 0;

  function pickSlot(slotNumber: number) {
    if (!canDraw) return;
    setError(null);
    setPhase({ name: "confirm", slotNumber });
  }

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
              <Button onClick={pickRandom} variant="gold" disabled={available.length === 0}>
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

      {/* Numbered pack grid */}
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {slots.map((s) => (
          <button
            key={s.slotNumber}
            type="button"
            disabled={s.taken || !canDraw}
            onClick={() => pickSlot(s.slotNumber)}
            className={cn(
              "flex aspect-[3/4] flex-col items-center justify-center rounded-lg border text-xs font-bold transition-all",
              s.taken
                ? "border-white/5 bg-slate-900/40 text-slate-700"
                : canDraw
                  ? "border-brand-500/40 bg-gradient-to-b from-brand-600/20 to-slate-900 text-brand-200 hover:scale-105 hover:border-brand-400 hover:shadow-[0_0_16px_-4px_rgba(230,57,70,0.5)]"
                  : "border-white/8 bg-slate-900/70 text-slate-500"
            )}
          >
            {s.taken ? <X size={14} /> : <GemLogo size={14} />}
            <span className="mt-1">#{s.slotNumber}</span>
          </button>
        ))}
      </div>

      {/* Confirm sheet */}
      {phase.name === "confirm" && (
        <Modal onClose={() => setPhase({ name: "idle" })}>
          <div className="text-center">
            <PackVisual title={seriesTitle} slotNumber={phase.slotNumber} />
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
                <PackVisual title={seriesTitle} slotNumber={phase.slotNumber} />
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

function PackVisual({ title, slotNumber }: { title: string; slotNumber: number }) {
  return (
    <div className="mx-auto flex h-52 w-36 flex-col items-center justify-between rounded-2xl border border-brand-500/30 bg-gradient-to-b from-brand-700 via-brand-800 to-slate-950 p-4 shadow-[0_16px_48px_-12px_rgba(193,18,31,0.6)]">
      <p className="line-clamp-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/80">
        {title}
      </p>
      <GemLogo size={56} />
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
      {/* White flash then aura + card */}
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
