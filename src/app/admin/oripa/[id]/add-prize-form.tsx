"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addPrizeAction } from "@/app/(dashboard)/oripa/actions";

export function AddPrizeForm({ seriesId }: { seriesId: string }) {
  const [state, action] = useFormState(addPrizeAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear form after successful add so the admin can rapid-fire prizes
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="seriesId" value={seriesId} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tier">Tier</Label>
          <Select id="tier" name="tier" defaultValue="D" required>
            <option value="S">S — grand prize</option>
            <option value="A">A — major hit</option>
            <option value="B">B — mid</option>
            <option value="C">C — minor</option>
            <option value="D">D — filler</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity in pool</Label>
          <Input id="quantity" name="quantity" type="number" min={1} max={1000} defaultValue={1} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Prize name</Label>
        <Input id="name" name="name" required maxLength={150} placeholder="e.g. Shanks OP01-120 Alt Art" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cardCode">Card code (optional)</Label>
          <Input id="cardCode" name="cardCode" placeholder="OP01-120 / BASE1-4" />
          <p className="text-xs text-slate-500">Links the catalog image automatically.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estValueMyr">Est. value (MYR)</Label>
          <Input id="estValueMyr" name="estValueMyr" type="number" step="0.01" min="0" placeholder="optional" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="imageUrl">Photo URL (optional)</Label>
        <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://... (overrides catalog image)" />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" name="isLastOne" className="h-4 w-4 rounded border-slate-700 bg-slate-900" />
        This is the <span className="font-semibold text-gold-500">Last One</span> prize (bonus for whoever draws the final pack — not part of the numbered pool)
      </label>

      {state?.error && (
        <div className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md border border-emerald-700/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
          Prize added.
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding..." : "Add prize"}
    </Button>
  );
}
