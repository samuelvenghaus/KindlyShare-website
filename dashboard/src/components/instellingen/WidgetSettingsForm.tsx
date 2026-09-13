"use client";

import { useActionState, useState } from "react";
import { Copy, Check } from "lucide-react";
import { generateWidgetTokenAction, type SettingsActionState } from "@/lib/actions/settings-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: SettingsActionState = {};

export function WidgetSettingsForm({ widgetToken, appUrl }: { widgetToken: string | null; appUrl: string }) {
  const [state, formAction] = useActionState(generateWidgetTokenAction, initialState);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard-API kan geblokkeerd zijn - de tekst staat al zichtbaar om zelf te selecteren.
    }
  }

  if (!widgetToken) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Plaats een feedbackformulier op je eigen website, zodat bezoekers ook daar een review kunnen achterlaten -
          niet alleen via de al gekoppelde kanalen en campagnes.
        </p>
        <form action={formAction} className="w-48">
          <SubmitButton>Widget activeren</SubmitButton>
        </form>
        {state.error && <p className="text-xs text-negative">{state.error}</p>}
      </div>
    );
  }

  const link = `${appUrl}/beoordeel/${widgetToken}`;
  const snippet = `<iframe src="${link}" width="100%" height="480" style="border:0;max-width:420px;" title="Laat feedback achter"></iframe>`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Plak dit stukje code op je website om een feedbackformulier in te bedden.</p>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-muted">Embed-code</span>
          <button
            type="button"
            onClick={() => copy(snippet, "snippet")}
            className="flex items-center gap-1 text-xs text-brand hover:underline"
          >
            {copied === "snippet" ? <Check size={12} /> : <Copy size={12} />}
            {copied === "snippet" ? "Gekopieerd" : "Kopiëren"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border bg-surface-elevated p-3 text-xs text-foreground">
          <code>{snippet}</code>
        </pre>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-muted">Of deel de directe link</span>
          <button
            type="button"
            onClick={() => copy(link, "link")}
            className="flex items-center gap-1 text-xs text-brand hover:underline"
          >
            {copied === "link" ? <Check size={12} /> : <Copy size={12} />}
            {copied === "link" ? "Gekopieerd" : "Kopiëren"}
          </button>
        </div>
        <p className="truncate rounded-lg border border-border bg-surface-elevated p-3 font-mono text-xs text-foreground">
          {link}
        </p>
      </div>

      <form action={formAction}>
        {state.error && <p className="mb-2 text-xs text-negative">{state.error}</p>}
        {state.success && <p className="mb-2 text-xs text-positive">{state.success}</p>}
        <button
          type="submit"
          onClick={(e) => {
            if (!confirm("Weet je zeker dat je een nieuwe link wilt genereren? De huidige embed-code werkt dan niet meer.")) {
              e.preventDefault();
            }
          }}
          className="text-xs text-muted hover:text-negative"
        >
          Nieuwe link genereren (maakt de huidige ongeldig)
        </button>
      </form>
    </div>
  );
}
