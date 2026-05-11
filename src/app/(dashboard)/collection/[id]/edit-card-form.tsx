"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateCardAction } from "../actions";
import { CONDITION_LABELS, LANGUAGE_LABELS } from "@/lib/utils";
import type { CardCondition, CardLanguage } from "@prisma/client";

interface Props {
  userCardId: string;
  defaults: {
    quantity: number;
    condition: CardCondition;
    language: CardLanguage;
    isAlternateArt: boolean;
    note: string | null;
    photoUrl: string | null;
  };
}

export function EditCardForm({ userCardId, defaults }: Props) {
  const action = updateCardAction.bind(null, userCardId);
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min={1} max={99} defaultValue={defaults.quantity} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="condition">Condition</Label>
          <Select id="condition" name="condition" defaultValue={defaults.condition}>
            {Object.entries(CONDITION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="language">Language</Label>
          <Select id="language" name="language" defaultValue={defaults.language}>
            {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="isAlternateArt"
              defaultChecked={defaults.isAlternateArt}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900"
            />
            Alt art / parallel
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" rows={3} defaultValue={defaults.note ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="photoUrl">Photo URL</Label>
        <Input id="photoUrl" name="photoUrl" type="url" defaultValue={defaults.photoUrl ?? ""} />
      </div>

      {state?.error && (
        <div className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md border border-emerald-700/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
          Saved.
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
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}
