"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createBuyRequestAction } from "../actions";
import { CONDITION_LABELS, LANGUAGE_LABELS, SHIPPING_LABELS } from "@/lib/utils";

export function BuyRequestForm({ cardCode }: { cardCode: string }) {
  const [state, action] = useFormState(createBuyRequestAction, null);

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="cardCode" value={cardCode} />

      <div className="space-y-1.5">
        <Label htmlFor="maxPriceMyr">Max price you'll pay (MYR)</Label>
        <Input
          id="maxPriceMyr"
          name="maxPriceMyr"
          type="number"
          step="0.01"
          min="0.01"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min={1} max={99} defaultValue={1} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="minCondition">Minimum condition</Label>
          <Select id="minCondition" name="minCondition" defaultValue="GOOD">
            {Object.entries(CONDITION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="language">Language (optional — any if blank)</Label>
        <Select id="language" name="language" defaultValue="">
          <option value="">Any language</option>
          {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shippingPref">Shipping preference</Label>
        <Select id="shippingPref" name="shippingPref" defaultValue="BOTH">
          {Object.entries(SHIPPING_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="preferredCity">Preferred city</Label>
          <Input id="preferredCity" name="preferredCity" placeholder="(optional)" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preferredState">Preferred state</Label>
          <Input id="preferredState" name="preferredState" placeholder="(optional)" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note for sellers</Label>
        <Textarea id="note" name="note" rows={3} placeholder="(Optional) Any specifics about the version, condition, etc." />
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
      {pending ? "Creating..." : "Post buy request"}
    </Button>
  );
}
