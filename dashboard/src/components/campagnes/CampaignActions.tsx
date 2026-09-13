"use client";

import { useActionState } from "react";
import { Send, RefreshCw } from "lucide-react";
import { sendCampaignAction, sendCampaignReminderAction, type CampaignActionState } from "@/lib/actions/campaign-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: CampaignActionState = {};

export function SendCampaignForm({ campaignId }: { campaignId: string }) {
  const [state, formAction] = useActionState(sendCampaignAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="campaignId" value={campaignId} />
      {state.error && <p className="text-sm text-negative">{state.error}</p>}
      {state.success && <p className="text-sm text-positive">{state.success}</p>}
      <div className="w-48">
        <SubmitButton>
          <span className="flex items-center gap-2">
            <Send size={15} /> Nu versturen
          </span>
        </SubmitButton>
      </div>
    </form>
  );
}

export function SendReminderForm({ campaignId }: { campaignId: string }) {
  const [state, formAction] = useActionState(sendCampaignReminderAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="campaignId" value={campaignId} />
      {state.error && <p className="text-sm text-negative">{state.error}</p>}
      {state.success && <p className="text-sm text-positive">{state.success}</p>}
      <button
        type="submit"
        className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated"
      >
        <RefreshCw size={15} /> Herinnering versturen aan wie nog niet reageerde
      </button>
    </form>
  );
}
