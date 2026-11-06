"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";

export function ActionButton({
  action,
  label,
  pendingLabel = "Memproses…",
  variant = "primary",
  className,
  children,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "ghost";
  className?: string;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <div className="flex flex-col items-start gap-1.5">
      <form action={formAction}>
        {children}
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "btn btn-sm",
            variant === "primary" ? "btn-primary" : "btn-ghost",
            className,
          )}
        >
          {pending ? pendingLabel : label}
        </button>
      </form>
      {state?.message ? (
        <p
          className={cn(
            "max-w-xs text-xs",
            state.ok ? "text-emerald-700" : "text-rose-600",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
