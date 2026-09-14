"use client";

import { useActionState } from "react";
import { X } from "lucide-react";
import { inviteTeamMemberAction, cancelInviteAction, type TeamActionState } from "@/lib/actions/team-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: TeamActionState = {};

export function TeamInviteForm({
  pendingInvites,
  emailConfigured,
}: {
  pendingInvites: { id: string; email: string }[];
  emailConfigured: boolean;
}) {
  const [state, formAction] = useActionState(inviteTeamMemberAction, initialState);
  const [cancelState, cancelFormAction] = useActionState(cancelInviteAction, initialState);

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <form action={formAction} className="flex items-end gap-2">
        <label className="flex-1 block">
          <span className="mb-1 block text-xs font-medium text-muted">Teamlid uitnodigen</span>
          <input
            name="email"
            type="email"
            required
            placeholder="collega@bedrijf.nl"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
          />
        </label>
        <div className="w-32">
          <SubmitButton>Uitnodigen</SubmitButton>
        </div>
      </form>

      {state.error && <p className="text-xs text-negative">{state.error}</p>}
      {state.success && (
        <div className="text-xs text-positive">
          <p>{state.success}</p>
          {!emailConfigured && state.inviteUrl && (
            <p className="mt-1 text-muted">
              E-mailverzending is nog niet geconfigureerd - stuur deze link zelf door: <br />
              <span className="break-all font-mono text-foreground">{state.inviteUrl}</span>
            </p>
          )}
        </div>
      )}

      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted">In afwachting</p>
          {pendingInvites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated px-3 py-2"
            >
              <span className="text-sm text-foreground">{invite.email}</span>
              <form action={cancelFormAction}>
                <input type="hidden" name="inviteId" value={invite.id} />
                <button type="submit" className="text-muted hover:text-negative" aria-label="Uitnodiging intrekken">
                  <X size={14} />
                </button>
              </form>
            </div>
          ))}
          {cancelState.error && <p className="text-xs text-negative">{cancelState.error}</p>}
        </div>
      )}
    </div>
  );
}
