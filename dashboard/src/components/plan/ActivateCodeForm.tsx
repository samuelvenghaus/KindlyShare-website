"use client";

import { useActionState } from "react";
import { activatePlanAction, type PlanActionState } from "@/lib/actions/plan-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: PlanActionState = {};

export function ActivateCodeForm() {
  const [state, formAction] = useActionState(activatePlanAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Activatiecode</span>
        <input
          name="code"
          type="text"
          autoComplete="off"
          placeholder="XXXX-XXXX"
          required
          className="w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-center text-sm font-mono uppercase tracking-widest text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
        />
      </label>

      {state.error && <p className="text-sm text-negative">{state.error}</p>}

      <SubmitButton>Activeren</SubmitButton>
    </form>
  );
}
