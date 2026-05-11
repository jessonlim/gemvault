"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "./actions";
import type { Profile } from "@prisma/client";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useFormState(updateProfileAction, null);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          maxLength={60}
          defaultValue={profile.displayName ?? ""}
          placeholder="The name people see"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          defaultValue={profile.avatarUrl ?? ""}
          placeholder="https://... (paste an image URL — upload coming soon)"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={500}
          defaultValue={profile.bio ?? ""}
          placeholder="Tell other collectors about you, what you collect, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            maxLength={60}
            defaultValue={profile.city ?? ""}
            placeholder="Kuala Lumpur"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            maxLength={60}
            defaultValue={profile.state ?? ""}
            placeholder="Selangor"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          name="country"
          maxLength={60}
          defaultValue={profile.country ?? "Malaysia"}
        />
        <p className="text-xs text-slate-500">
          We only show city/state on your profile — never exact addresses.
        </p>
      </div>

      {state?.error && (
        <div className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md border border-emerald-700/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
          Profile updated.
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
