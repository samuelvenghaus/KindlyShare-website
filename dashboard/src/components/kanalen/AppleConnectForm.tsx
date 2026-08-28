"use client";

import { useActionState } from "react";
import { connectAppleAction, type SyncActionState } from "@/lib/actions/channel-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: SyncActionState = {};

export function AppleConnectForm() {
  const [state, formAction] = useActionState(connectAppleAction, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">App Store-app ID</span>
        <input
          name="appId"
          placeholder="1234567890"
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Issuer ID</span>
        <input
          name="issuerId"
          placeholder="69a6de..."
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Key ID</span>
        <input
          name="keyId"
          placeholder="ABC123DEF4"
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Private key (.p8-inhoud)</span>
        <textarea
          name="privateKey"
          rows={4}
          placeholder="-----BEGIN PRIVATE KEY-----..."
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
        />
      </label>

      {state.error && <p className="text-xs text-negative">{state.error}</p>}
      {state.success && <p className="text-xs text-positive">{state.success}</p>}

      <SubmitButton>Verbinden met App Store Connect</SubmitButton>
    </form>
  );
}
