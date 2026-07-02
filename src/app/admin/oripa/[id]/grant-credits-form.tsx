"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { grantCreditsAction } from "@/app/(dashboard)/oripa/actions";

export function GrantCreditsForm({ seriesId }: { seriesId: string }) {
  const [state, action] = useFormState(grantCreditsAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="seriesId" value={seriesId} />

      <div className="min-w-[160px] flex-1 space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" required placeholder="buyer's @username" />
      </div>

      <div className="w-28 space-y-1.5">
        <Label htmlFor="credits">Draws</Label>
        <Input id="credits" name="credits" type="number" min={1} max={500} defaultValue={1} required />
      </div>

      <SubmitButton />

      {state?.error && (
        <p className="w-full text-sm text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="w-full text-sm text-emerald-400">Credits granted.</p>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Granting..." : "Grant"}
    </Button>
  );
}
