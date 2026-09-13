import "server-only";

const RESEND_API_URL = "https://api.resend.com/emails";

export function isCampaignEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.CAMPAIGN_EMAIL_FROM);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin: 0 0 16px;">${escapeHtml(p.trim()).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

interface SendCampaignEmailInput {
  to: string;
  recipientName: string | null;
  companyName: string;
  senderName: string;
  replyToEmail: string;
  subject: string;
  body: string;
  formUrl: string;
  unsubscribeUrl: string;
  trackingPixelUrl: string;
  isReminder?: boolean;
}

async function sendViaResend(input: SendCampaignEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.CAMPAIGN_EMAIL_FROM;
  if (!apiKey || !fromAddress) return;

  const greeting = input.recipientName ? `Hoi ${escapeHtml(input.recipientName)},` : "Hoi,";
  const reminderNote = input.isReminder
    ? `<p style="margin: 0 0 16px; color: #71717a; font-size: 13px;">Nog even een klein herinnering - mocht je de vorige mail gemist hebben:</p>`
    : "";

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #18181b;">
      ${reminderNote}
      <p style="margin: 0 0 16px;">${greeting}</p>
      ${paragraphs(input.body)}
      <p style="margin: 24px 0;">
        <a href="${input.formUrl}" style="background: #ffc72c; color: #0a0a0a; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">
          Deel je feedback
        </a>
      </p>
      <p style="margin: 32px 0 0; font-size: 12px; color: #a1a1aa;">
        Deze uitnodiging is verstuurd namens ${escapeHtml(input.companyName)}.
        <a href="${input.unsubscribeUrl}" style="color: #a1a1aa;">Afmelden voor dit soort verzoeken</a>
      </p>
      <img src="${input.trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
    </div>
  `.trim();

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${input.senderName} <${fromAddress}>`,
      to: [input.to],
      reply_to: input.replyToEmail,
      subject: input.isReminder ? `Herinnering: ${input.subject}` : input.subject,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API-aanroep mislukt (${response.status}): ${await response.text()}`);
  }
}

export async function sendCampaignInviteEmail(input: SendCampaignEmailInput): Promise<void> {
  await sendViaResend(input);
}

export async function sendCampaignReminderEmail(input: SendCampaignEmailInput): Promise<void> {
  await sendViaResend({ ...input, isReminder: true });
}
