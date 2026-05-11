"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { startConversationAction } from "@/app/(dashboard)/messages/actions";
import { MessageCircle, X } from "lucide-react";

interface Props {
  /** The other party's username */
  recipientUsername: string;
  /** Optional listing context */
  saleListingId?: string | null;
  /** If the viewer isn't logged in, send them here first */
  isAuthed: boolean;
  /** Don't render if viewer is the recipient */
  isOwner?: boolean;
  label?: string;
  variant?: "primary" | "outline";
  /** Suggested first message */
  defaultMessage?: string;
}

export function ContactButton({
  recipientUsername,
  saleListingId,
  isAuthed,
  isOwner,
  label = "Contact",
  variant = "primary",
  defaultMessage,
}: Props) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(startConversationAction, null);

  if (isOwner) return null;

  if (!isAuthed) {
    const next = encodeURIComponent(typeof window === "undefined" ? "/" : window.location.pathname);
    return (
      <Link href={`/login?redirect=${next}`}>
        <Button variant={variant}>
          <MessageCircle size={16} /> {label}
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <MessageCircle size={16} /> {label}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">
                  Message @{recipientUsername}
                </h2>
                <p className="text-xs text-slate-400">
                  Keep messages friendly. No external contact details on first reply.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form action={action} className="mt-4 space-y-3">
              <input type="hidden" name="recipientUsername" value={recipientUsername} />
              {saleListingId && (
                <input type="hidden" name="saleListingId" value={saleListingId} />
              )}

              <div className="space-y-1.5">
                <Label htmlFor="initialMessage">Your message</Label>
                <Textarea
                  id="initialMessage"
                  name="initialMessage"
                  rows={4}
                  required
                  defaultValue={defaultMessage}
                  placeholder="Hi! I'm interested in this card..."
                />
              </div>

              {state?.error && (
                <div className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                  {state.error}
                </div>
              )}

              <SubmitButton />
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending..." : "Send message"}
    </Button>
  );
}
