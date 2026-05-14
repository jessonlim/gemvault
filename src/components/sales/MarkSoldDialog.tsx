"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { markSoldAction } from "@/app/(dashboard)/sales/actions";
import { CheckCircle2 } from "lucide-react";

interface Props {
  userCardId: string;
  defaultPrice: number;
  /** Pre-populated buyer suggestions (e.g. people who've messaged about this listing) */
  buyerSuggestions?: { username: string; displayName: string | null }[];
}

export function MarkSoldDialog({ userCardId, defaultPrice, buyerSuggestions = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(markSoldAction, null);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <CheckCircle2 size={16} /> Mark as sold
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Mark card as sold">
        <form action={action} className="space-y-4">
          <input type="hidden" name="userCardId" value={userCardId} />

          <div className="space-y-1.5">
            <Label htmlFor="buyerUsername">Buyer&apos;s username</Label>
            <Input
              id="buyerUsername"
              name="buyerUsername"
              placeholder="@username"
              required
              autoFocus
              list="buyer-suggestions"
            />
            {buyerSuggestions.length > 0 && (
              <datalist id="buyer-suggestions">
                {buyerSuggestions.map((b) => (
                  <option key={b.username} value={b.username}>
                    {b.displayName ?? b.username}
                  </option>
                ))}
              </datalist>
            )}
            {buyerSuggestions.length > 0 && (
              <p className="text-xs text-slate-500">
                Suggestions: {buyerSuggestions.slice(0, 3).map((b) => `@${b.username}`).join(", ")}
                {buyerSuggestions.length > 3 && ` +${buyerSuggestions.length - 3} more`}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="finalPriceMyr">Final price (MYR)</Label>
            <Input
              id="finalPriceMyr"
              name="finalPriceMyr"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={defaultPrice}
              required
            />
            <p className="text-xs text-slate-500">
              Enter the actual sale price — may differ from your listing if you negotiated.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sellerNote">Note (optional)</Label>
            <Textarea
              id="sellerNote"
              name="sellerNote"
              rows={2}
              placeholder="Any context for the buyer..."
            />
          </div>

          <div className="rounded-xl border border-brand-500/30 bg-brand-600/5 p-3 text-xs text-slate-300">
            <p className="font-medium text-brand-300">What happens next:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-slate-400">
              <li>The buyer must confirm before the sale is final</li>
              <li>Your listing pauses while waiting for confirmation</li>
              <li>Once confirmed, you can both rate each other</li>
            </ul>
          </div>

          {state?.error && (
            <div className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
              {state.error}
            </div>
          )}

          <SubmitButton />
        </form>
      </Sheet>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Marking..." : "Mark as sold"}
    </Button>
  );
}
