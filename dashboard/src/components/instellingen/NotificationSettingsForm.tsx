"use client";

import { useActionState } from "react";
import {
  updateNotificationSettingsAction,
  sendTestSlackNotificationAction,
  type SettingsActionState,
} from "@/lib/actions/settings-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: SettingsActionState = {};

export function NotificationSettingsForm({
  alertEmailEnabled,
  hasSlackWebhook,
  emailConfigured,
  userEmails,
}: {
  alertEmailEnabled: boolean;
  hasSlackWebhook: boolean;
  emailConfigured: boolean;
  userEmails: string[];
}) {
  const [state, formAction] = useActionState(updateNotificationSettingsAction, initialState);
  const [testState, testFormAction] = useActionState(sendTestSlackNotificationAction, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        <div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="alertEmailEnabled"
              defaultChecked={alertEmailEnabled}
              className="mt-0.5 h-4 w-4 rounded border-border accent-brand"
            />
            <span>
              <span className="block text-sm font-medium text-foreground">E-mail bij nieuwe alerts</span>
              <span className="block text-xs text-muted">
                {emailConfigured
                  ? `Verstuurd naar: ${userEmails.join(", ")}`
                  : "E-mailverzending is nog niet geconfigureerd (RESEND_API_KEY ontbreekt) - deze instelling heeft nog geen effect."}
              </span>
            </span>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Slack incoming-webhook-URL</span>
          <input
            name="slackWebhookUrl"
            type="text"
            placeholder={hasSlackWebhook ? "Al ingesteld - vul een nieuwe URL in om te wijzigen" : "https://hooks.slack.com/services/..."}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
          />
          <span className="mt-1 block text-xs text-muted">
            Maak een{" "}
            <a
              href="https://api.slack.com/messaging/webhooks"
              target="_blank"
              rel="noreferrer"
              className="text-brand hover:underline"
            >
              incoming webhook
            </a>{" "}
            aan in je Slack-werkruimte en plak de URL hier. Laat leeg om Slack-notificaties uit te schakelen.
          </span>
        </label>

        {state.error && <p className="text-xs text-negative">{state.error}</p>}
        {state.success && <p className="text-xs text-positive">{state.success}</p>}

        <div className="w-40">
          <SubmitButton>Opslaan</SubmitButton>
        </div>
      </form>

      {hasSlackWebhook && (
        <form action={testFormAction} className="border-t border-border pt-4">
          <p className="mb-2 text-xs text-muted">Stuur een testbericht om te controleren of de koppeling werkt.</p>
          {testState.error && <p className="mb-2 text-xs text-negative">{testState.error}</p>}
          {testState.success && <p className="mb-2 text-xs text-positive">{testState.success}</p>}
          <div className="w-52">
            <SubmitButton>Testbericht versturen</SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
