import "server-only";
import { prisma } from "@/lib/prisma";
import { sendCampaignReminderEmail } from "./email";

const REMINDER_DELAY_DAYS = 3;

function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export interface ReminderRunResult {
  sent: number;
  failed: number;
}

/** Stuurt een herinnering naar campagne-ontvangers die na REMINDER_DELAY_DAYS nog niet
 * gereageerd hebben (en er nog geen herinnering naar gestuurd is). Bedoeld om periodiek
 * te draaien via een externe scheduler. */
export async function sendDueCampaignReminders(): Promise<ReminderRunResult> {
  const cutoff = new Date(Date.now() - REMINDER_DELAY_DAYS * 24 * 60 * 60 * 1000);

  const dueRecipients = await prisma.campaignRecipient.findMany({
    where: { status: "sent", reminderSentAt: null, sentAt: { lte: cutoff } },
    include: { campaign: { include: { company: true } } },
  });

  const appUrl = getAppUrl();
  let sent = 0;
  let failed = 0;

  for (const recipient of dueRecipients) {
    try {
      await sendCampaignReminderEmail({
        to: recipient.email,
        recipientName: recipient.name,
        companyName: recipient.campaign.company.name,
        senderName: recipient.campaign.senderName,
        replyToEmail: recipient.campaign.replyToEmail,
        subject: recipient.campaign.subject,
        body: recipient.campaign.bodyHtml,
        formUrl: `${appUrl}/feedback-formulier/${recipient.token}`,
        unsubscribeUrl: `${appUrl}/afmelden/${recipient.token}`,
        trackingPixelUrl: `${appUrl}/api/campagnes/track/${recipient.token}`,
      });
      await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { reminderSentAt: new Date() } });
      sent++;
    } catch (err) {
      console.error(`Automatische herinnering mislukt voor ${recipient.email}:`, err);
      failed++;
    }
  }

  return { sent, failed };
}
