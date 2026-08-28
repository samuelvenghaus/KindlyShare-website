import "server-only";

export interface AlertSlackInput {
  webhookUrl: string;
  companyName: string;
  topicLabel: string;
  increasePercentage: number;
  windowDays: number;
  priority: "low" | "medium" | "high";
  reviewCount: number;
  aiSuggestion: string | null;
  appUrl: string;
}

const PRIORITY_EMOJI: Record<AlertSlackInput["priority"], string> = {
  low: ":large_yellow_circle:",
  medium: ":large_orange_circle:",
  high: ":red_circle:",
};

/** Verstuurt een bericht naar een Slack incoming webhook wanneer er een nieuwe alert is aangemaakt. */
export async function sendAlertSlackMessage(input: AlertSlackInput): Promise<void> {
  const lines = [
    `${PRIORITY_EMOJI[input.priority]} *${input.companyName}: nieuwe probleemmelding*`,
    `*${input.topicLabel}* — ${input.increasePercentage}% toename in de afgelopen ${input.windowDays} dagen (${input.reviewCount} meldingen)`,
  ];
  if (input.aiSuggestion) {
    lines.push(`_AI-suggestie:_ ${input.aiSuggestion}`);
  }
  lines.push(`<${input.appUrl}/alerts|Bekijk in KindlyShare>`);

  const response = await fetch(input.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: lines.join("\n") }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook-aanroep mislukt (${response.status}): ${await response.text()}`);
  }
}
