"use client";

import { useActionState } from "react";
import { updateCampaignSenderDefaultsAction, type SettingsActionState } from "@/lib/actions/settings-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: SettingsActionState = {};

export function CampaignSenderForm({
  currentSenderName,
  currentReplyToEmail,
}: {
  currentSenderName: string;
  currentReplyToEmail: string;
}) {
  const [state, formAction] = useActionState(updateCampaignSenderDefaultsAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-xs text-muted">
        Dit is de afzendernaam en het antwoordadres die klanten zien wanneer je een feedbackcampagne verstuurt. De
        e-mail wordt technisch verstuurd via het beveiligde e-maildomein van KindlyShare, maar toont deze naam - reacties
        van klanten komen binnen op het antwoordadres hieronder. Je kunt dit per campagne nog aanpassen.
      </p>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Afzendernaam</span>
        <input
          name="campaignSenderName"
          defaultValue={currentSenderName}
          required
          maxLength={100}
          placeholder="Bijv. Café De Kroon"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Antwoordadres</span>
        <input
          name="campaignReplyToEmail"
          type="email"
          defaultValue={currentReplyToEmail}
          required
          placeholder="info@jouwbedrijf.nl"
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
