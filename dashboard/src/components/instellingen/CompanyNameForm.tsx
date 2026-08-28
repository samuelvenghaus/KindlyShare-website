"use client";

import { useActionState } from "react";
import { updateCompanyNameAction, type SettingsActionState } from "@/lib/actions/settings-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: SettingsActionState = {};

export function CompanyNameForm({ currentName }: { currentName: string }) {
  const [state, formAction] = useActionState(updateCompanyNameAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Bedrijfsnaam</span>
        <input
          name="name"
          defaultValue={currentName}
          required
          maxLength={200}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
        />
      </label>

      {state.error && <p className="text-xs text-negative">{state.error}</p>}
      {state.success && <p className="text-xs text-positive">{state.success}</p>}

      <div className="w-40">
        <SubmitButton>Opslaan</SubmitButton>
      </div>
    </form>
  );
}
