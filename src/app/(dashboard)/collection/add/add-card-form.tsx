"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addCardAction } from "../actions";
import { CONDITION_LABELS, LANGUAGE_LABELS } from "@/lib/utils";

export function AddCardForm({ cardCode }: { cardCode: string }) {
  const [state, action] = useFormState(addCardAction, null);

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="cardCode" value={cardCode} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min={1} max={99} defaultValue={1} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="condition">Condition</Label>
          <Select id="condition" name="condition" defaultValue="NEAR_MINT">
            {Object.entries(CONDITION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="language">Language</Label>
          <Select id="language" name="language" defaultValue="EN">
            {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" name="isAlternateArt" className="h-4 w-4 rounded border-slate-700 bg-slate-900" />
            Alt art / parallel
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" name="note" placeholder="Any details about this card — graded, signed, etc." rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="photoUrl">Photo URL (optional)</Label>
        <Input id="photoUrl" name="photoUrl" type="url" placeholder="https://..." />
        <p className="text-xs text-slate-500">Photo upload coming soon — paste a hosted image URL for now.</p>
      </div>

      {state?.error && (
        <div className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Adding..." : "Add to collection"}
    </Button>
  );
}
