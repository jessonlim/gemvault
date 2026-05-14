"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "@/components/ui/sheet";
import { confirmSaleAction, disputeSaleAction, cancelSaleAction } from "@/app/(dashboard)/sales/actions";
import { Check, X, AlertTriangle } from "lucide-react";

interface Props {
  saleId: string;
  /** True if the viewer is the buyer. Sellers can only cancel a pending sale. */
  isBuyer: boolean;
}

export function ConfirmSaleControls({ saleId, isBuyer }: Props) {
  const [pending, startTransition] = useTransition();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeNote, setDisputeNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmSaleAction(saleId);
      if (result?.error) setError(result.error);
    });
  }

  function onDispute() {
    setError(null);
    startTransition(async () => {
      const result = await disputeSaleAction(saleId, disputeNote);
      if (result?.error) setError(result.error);
      else setDisputeOpen(false);
    });
  }

  function onCancel() {
    if (!window.confirm("Cancel this sale? The listing will become active again.")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelSaleAction(saleId);
      if (result?.error) setError(result.error);
    });
  }

  if (!isBuyer) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={pending}>
          <X size={14} /> {pending ? "Cancelling..." : "Cancel sale"}
        </Button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onConfirm} disabled={pending} className="flex-1">
          <Check size={16} /> {pending ? "Confirming..." : "Confirm sale"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setDisputeOpen(true)}
          disabled={pending}
          className="flex-1"
        >
          <AlertTriangle size={14} /> Dispute
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <Sheet open={disputeOpen} onClose={() => setDisputeOpen(false)} title="Dispute this sale">
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Tell us what&apos;s wrong. A moderator will review the dispute.
          </p>
          <Textarea
            rows={4}
            value={disputeNote}
            onChange={(e) => setDisputeNote(e.target.value)}
            placeholder="e.g. The condition was misrepresented..."
          />
          <Button onClick={onDispute} disabled={pending || !disputeNote.trim()} className="w-full">
            {pending ? "Submitting..." : "Submit dispute"}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
