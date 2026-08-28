import "server-only";

const RESEND_API_URL = "https://api.resend.com/emails";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_FROM);
}

export interface AlertEmailInput {
  to: string[];
  companyName: string;
  topicLabel: string;
  increasePercentage: number;
  windowDays: number;
  priority: "low" | "medium" | "high";
  reviewCount: number;
  aiSuggestion: string | null;
  appUrl: string;
}

const PRIORITY_LABELS: Record<AlertEmailInput["priority"], string> = {
  low: "Lage prioriteit",
  medium: "Gemiddelde prioriteit",
  high: "Hoge prioriteit",
};

/** Verstuurt een e-mail via de Resend API wanneer er een nieuwe alert is aangemaakt. */
export async function sendAlertEmail(input: AlertEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_EMAIL_FROM;
  if (!apiKey || !from || input.to.length === 0) return;

  const subject = `[${PRIORITY_LABELS[input.priority]}] Nieuw probleem gedetecteerd: ${input.topicLabel}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px;">
      <h2 style="margin-bottom: 4px;">${input.companyName}: nieuwe probleemmelding</h2>
      <p style="color: #555;">${PRIORITY_LABELS[input.priority]}</p>
      <p><strong>${input.topicLabel}</strong> komt ${input.increasePercentage}% vaker voor in de afgelopen ${input.windowDays} dagen dan in de periode daarvoor (${input.reviewCount} meldingen).</p>
      ${input.aiSuggestion ? `<p><strong>AI-suggestie:</strong> ${input.aiSuggestion}</p>` : ""}
      <p><a href="${input.appUrl}/alerts" style="color: #6366f1;">Bekijk in KindlyShare →</a></p>
    </div>
  `.trim();

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API-aanroep mislukt (${response.status}): ${await response.text()}`);
  }
}
