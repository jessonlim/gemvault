"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { setSellModeAction } from "../actions";
import { SHIPPING_LABELS } from "@/lib/utils";
import type { SaleListing, SellPreference, SellMode } from "@prisma/client";
import { cn } from "@/lib/utils";

interface Props {
  userCardId: string;
  currentMode: SellMode;
  saleListing: SaleListing | null;
  sellPreference: SellPreference | null;
}

export function SellModeForm({ userCardId, currentMode, saleListing, sellPreference }: Props) {
  const action = setSellModeAction.bind(null, userCardId);
  const [state, formAction] = useFormState(action, null);
  const [mode, setMode] = useState<SellMode>(currentMode);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ModeOption
          value="COLLECTION"
          current={mode}
          onChange={setMode}
          label="Collection only"
          description="Private. Not visible to buyers."
        />
        <ModeOption
          value="OPEN_TO_OFFERS"
          current={mode}
          onChange={setMode}
          label="Open to offers"
          description="Buyers can find this card and offer ≥ your minimum."
        />
        <ModeOption
          value="LISTED_FOR_SALE"
          current={mode}
          onChange={setMode}
          label="Listed for sale"
          description="Public listing at a fixed price."
        />
      </div>

      <input type="hidden" name="sellMode" value={mode} />

      {mode === "OPEN_TO_OFFERS" && (
        <div className="space-y-3 rounded-lg border border-slate-800 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="minimumPriceMyr">Minimum acceptable price (MYR)</Label>
            <Input
              id="minimumPriceMyr"
              name="minimumPriceMyr"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={sellPreference?.minimumPriceMyr ?? ""}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shippingPref">Shipping preference</Label>
            <Select id="shippingPref" name="shippingPref" defaultValue={sellPreference?.shippingPref ?? "BOTH"}>
              {Object.entries(SHIPPING_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note for buyers</Label>
            <Textarea id="note" name="note" rows={2} defaultValue={sellPreference?.note ?? ""} />
          </div>
        </div>
      )}

      {mode === "LISTED_FOR_SALE" && (
        <div className="space-y-3 rounded-lg border border-slate-800 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="priceMyr">Asking price (MYR)</Label>
              <Input
                id="priceMyr"
                name="priceMyr"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={saleListing?.priceMyr ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shippingFeeMyr">Shipping fee (MYR)</Label>
              <Input
                id="shippingFeeMyr"
                name="shippingFeeMyr"
                type="number"
                step="0.01"
                min="0"
                defaultValue={saleListing?.shippingFeeMyr ?? ""}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shippingPref">Shipping preference</Label>
            <Select id="shippingPref" name="shippingPref" defaultValue={saleListing?.shippingPref ?? "BOTH"}>
              {Object.entries(SHIPPING_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Listing description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={saleListing?.description ?? ""} />
          </div>
        </div>
      )}

      {state?.error && (
        <div className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md border border-emerald-700/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
          Selling mode updated.
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function ModeOption({
  value,
  current,
  onChange,
  label,
  description,
}: {
  value: SellMode;
  current: SellMode;
  onChange: (m: SellMode) => void;
  label: string;
  description: string;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={cn(
        "rounded-lg border p-3 text-left transition",
        active
          ? "border-brand-500 bg-brand-600/10"
          : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
      )}
    >
      <p className={cn("text-sm font-semibold", active ? "text-brand-300" : "text-slate-100")}>
        {label}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{description}</p>
    </button>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Update selling mode"}
    </Button>
  );
}
