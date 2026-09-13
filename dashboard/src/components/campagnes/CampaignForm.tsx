"use client";

import { useActionState, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  createCampaignAction,
  generateCampaignDraftAction,
  type CampaignActionState,
} from "@/lib/actions/campaign-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: CampaignActionState = {};

const inputClassName =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none";

export function CampaignForm({
  defaultSenderName,
  defaultReplyToEmail,
}: {
  defaultSenderName: string;
  defaultReplyToEmail: string;
}) {
  const [createState, createFormAction] = useActionState(createCampaignAction, initialState);
  const [draftState, draftFormAction, draftPending] = useActionState(generateCampaignDraftAction, initialState);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [appliedDraftState, setAppliedDraftState] = useState(draftState);

  if (draftState !== appliedDraftState) {
    setAppliedDraftState(draftState);
    if (draftState.subject) setSubject(draftState.subject);
    if (draftState.body) setBody(draftState.body);
  }

  return (
    <form action={createFormAction} className="space-y-6">
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Campagnenaam (intern, klanten zien dit niet)</span>
          <input name="name" placeholder="Bv. Voorjaar 2026 feedbackronde" required className={inputClassName} />
        </label>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">E-mailinhoud</p>
          <button
            type="submit"
            formAction={draftFormAction}
            formNoValidate
            disabled={draftPending}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-elevated disabled:opacity-60"
          >
            {draftPending ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            AI-tekst genereren
          </button>
        </div>

        {draftState.error && <p className="text-xs text-negative">{draftState.error}</p>}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Onderwerpregel</span>
          <input
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Bv. Wat vind jij van ons?"
            required
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">E-mailtekst</span>
          <textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Schrijf hier je bericht, of genereer een concept met AI."
            required
            className={inputClassName}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Afzendernaam</span>
          <input name="senderName" defaultValue={defaultSenderName} placeholder="Bv. Kindly Koffie" required className={inputClassName} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Antwoordadres</span>
          <input
            name="replyToEmail"
            type="email"
            defaultValue={defaultReplyToEmail}
            placeholder="info@jouwbedrijf.nl"
            required
            className={inputClassName}
          />
        </label>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          De mail toont deze naam als afzender; antwoorden van klanten komen op dit adres binnen.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-foreground">Klantenlijst</p>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">CSV-bestand uploaden (naam,email per regel)</span>
          <input
            name="csvFile"
            type="file"
            accept=".csv,text/csv,text/plain"
            className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-foreground"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Of plak e-mailadressen (één per regel)</span>
          <textarea
            name="manualRecipients"
            rows={4}
            placeholder={"jan@voorbeeld.nl\nMarieke <marieke@voorbeeld.nl>"}
            className={inputClassName + " font-mono text-xs"}
          />
        </label>
      </div>

      {createState.error && <p className="text-sm text-negative">{createState.error}</p>}

      <div className="w-56">
        <SubmitButton>Concept aanmaken</SubmitButton>
      </div>
    </form>
  );
}
