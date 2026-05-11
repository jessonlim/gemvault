"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCardAction } from "../actions";

export function DeleteCardButton({ userCardId }: { userCardId: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("Remove this card from your collection? This cannot be undone.")) return;
    startTransition(() => deleteCardAction(userCardId));
  }

  return (
    <Button variant="danger" size="sm" onClick={onClick} disabled={pending}>
      <Trash2 size={16} /> {pending ? "Removing..." : "Remove from collection"}
    </Button>
  );
}
