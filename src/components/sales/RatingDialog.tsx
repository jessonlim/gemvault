"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "@/components/ui/sheet";
import { submitRatingAction } from "@/app/(dashboard)/sales/actions";
import { Star } from "lucide-react";

interface Props {
  saleId: string;
  /** Username of the person being rated */
  otherUsername: string;
  /** Trigger button label */
  label?: string;
}

export function RatingDialog({ saleId, otherUsername, label = "Leave a rating" }: Props) {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(5);
  const [state, action] = useFormState(submitRatingAction, null);

  return (
    <>
      <Button variant="gold" size="sm" onClick={() => setOpen(true)}>
        <Star size={14} /> {label}
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title={`Rate @${otherUsername}`}>
        <form action={action} className="space-y-4">
          <input type="hidden" name="saleId" value={saleId} />
          <input type="hidden" name="stars" value={stars} />

          <div>
            <p className="mb-2 text-sm text-slate-300">How was the experience?</p>
            <StarPicker value={stars} onChange={setStars} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="review" className="text-sm font-medium text-slate-200">
              Review (optional)
            </label>
            <Textarea
              id="review"
              name="review"
              rows={3}
              maxLength={500}
              placeholder="Communication, condition accuracy, speed..."
            />
          </div>

          {state?.error && (
            <div className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="rounded-md border border-emerald-700/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
              Thanks for rating!
            </div>
          )}

          <SubmitButton />
        </form>
      </Sheet>
    </>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          className="p-1"
          aria-label={`${n} stars`}
        >
          <Star
            size={32}
            className={
              n <= display ? "fill-gold-500 text-gold-500" : "text-slate-700"
            }
            strokeWidth={1.5}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-semibold text-slate-200">{display}/5</span>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Submitting..." : "Submit rating"}
    </Button>
  );
}
