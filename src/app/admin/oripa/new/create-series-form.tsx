"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createSeriesAction } from "@/app/(dashboard)/oripa/actions";

export function CreateSeriesForm() {
  const [state, action] = useFormState(createSeriesAction, null);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Series title</Label>
        <Input id="title" name="title" required maxLength={100} placeholder="e.g. OP01 Alt-Art Hunt Vol. 1" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={1000}
          placeholder="What's in this oripa, shipping/meetup rules, top prize highlight..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="game">Game</Label>
          <Select id="game" name="game" defaultValue="">
            <option value="">Mixed / other</option>
            <option value="ONE_PIECE">One Piece</option>
            <option value="POKEMON">Pokémon</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pricePerDrawMyr">Price per draw (MYR)</Label>
          <Input
            id="pricePerDrawMyr"
            name="pricePerDrawMyr"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="15.00"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="coverImageUrl">Cover image URL</Label>
        <Input id="coverImageUrl" name="coverImageUrl" type="url" placeholder="https://... (optional)" />
        <p className="text-xs text-slate-500">Shown on the public oripa list. A photo of the top prize works great.</p>
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
      {pending ? "Creating..." : "Create draft — add prizes next"}
    </Button>
  );
}
