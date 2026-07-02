"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  activateSeriesAction,
  archiveSeriesAction,
  removePrizeAction,
  toggleFulfilledAction,
} from "@/app/(dashboard)/oripa/actions";
import { Rocket, Archive, Trash2, Check } from "lucide-react";
import type { OripaStatus } from "@prisma/client";

export function SeriesControls({
  seriesId,
  status,
  totalPacks,
}: {
  seriesId: string;
  status: OripaStatus;
  totalPacks: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function activate() {
    if (
      !window.confirm(
        `Activate this series with ${totalPacks} packs?\n\nThe prize pool locks permanently — you can't add or remove prizes after this. Buyers will see the series on /oripa.`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await activateSeriesAction(seriesId);
      if (result?.error) setError(result.error);
    });
  }

  function archive() {
    if (!window.confirm("Archive this series? It will be hidden from the public list.")) return;
    setError(null);
    startTransition(async () => {
      const result = await archiveSeriesAction(seriesId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {status === "DRAFT" && (
          <Button onClick={activate} disabled={pending || totalPacks < 2}>
            <Rocket size={16} /> {pending ? "Activating..." : `Activate (${totalPacks} packs)`}
          </Button>
        )}
        {(status === "ACTIVE" || status === "SOLD_OUT") && (
          <Button variant="secondary" size="sm" onClick={archive} disabled={pending}>
            <Archive size={14} /> Archive
          </Button>
        )}
      </div>
      {status === "DRAFT" && totalPacks < 2 && (
        <p className="text-xs text-slate-500">Add at least 2 packs' worth of prizes to activate.</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function RemovePrizeButton({ prizeId, seriesId }: { prizeId: string; seriesId: string }) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm("Remove this prize from the draft?")) return;
    startTransition(async () => {
      await removePrizeAction(prizeId, seriesId);
    });
  }

  return (
    <Button variant="ghost" size="icon" onClick={remove} disabled={pending} aria-label="Remove prize">
      <Trash2 size={16} className="text-slate-500 hover:text-red-400" />
    </Button>
  );
}

export function FulfillToggle({
  slotId,
  seriesId,
  fulfilled,
}: {
  slotId: string;
  seriesId: string;
  fulfilled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={fulfilled ? "secondary" : "outline"}
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleFulfilledAction(slotId, seriesId);
        })
      }
    >
      {fulfilled ? (
        <>
          <Check size={14} /> Done
        </>
      ) : (
        "Mark fulfilled"
      )}
    </Button>
  );
}
