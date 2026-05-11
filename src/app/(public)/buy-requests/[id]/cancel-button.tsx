"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelBuyRequestAction } from "@/app/(dashboard)/buy-requests/actions";

export function CancelBuyRequestButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("Cancel this buy request? You can post a new one anytime.")) return;
    startTransition(() => cancelBuyRequestAction(id));
  }

  return (
    <Button variant="danger" size="sm" onClick={onClick} disabled={pending}>
      {pending ? "Cancelling..." : "Cancel buy request"}
    </Button>
  );
}
