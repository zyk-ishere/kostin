"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";

export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Menyimpan…",
  className,
  buttonClassName,
  footer,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
  buttonClassName?: string;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className={className ?? "space-y-4"}>
      {children}

      {state && !state.ok ? (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {state.message}
        </p>
      ) : null}

      {state?.ok ? (
        <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={cn("btn btn-primary", buttonClassName)}
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        {footer}
      </div>
    </form>
  );
}
