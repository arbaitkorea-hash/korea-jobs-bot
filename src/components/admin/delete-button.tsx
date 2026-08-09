"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({ action, confirmText = "Удалить без возможности восстановления?" }: { action: () => Promise<void>; confirmText?: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(confirmText)) return;
        startTransition(() => {
          action();
        });
      }}
      aria-label="Удалить"
      className="text-fg-muted hover:text-danger disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}
