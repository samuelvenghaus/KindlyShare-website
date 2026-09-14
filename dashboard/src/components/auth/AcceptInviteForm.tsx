"use client";

import { useActionState } from "react";
import { acceptInviteAction, type AcceptInviteFormState } from "@/lib/actions/accept-invite-actions";
import { AuthField } from "@/components/auth/AuthShell";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: AcceptInviteFormState = {};

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [state, formAction] = useActionState(acceptInviteAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">E-mailadres</span>
        <input
          value={email}
          disabled
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-muted"
        />
      </label>

      <AuthField label="Je naam" name="name" autoComplete="name" placeholder="Voor- en achternaam" />
      <AuthField
        label="Wachtwoord"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Minstens 8 tekens"
      />

      {state.error && <p className="text-sm text-negative">{state.error}</p>}

      <SubmitButton>Account aanmaken</SubmitButton>
    </form>
  );
}
