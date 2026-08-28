import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { isEmailConfigured, sendAlertEmail } from "./email";
import { sendAlertSlackMessage } from "./slack";
import type { AlertWithTopic } from "@/lib/ai/alerts";

function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

/** Verstuurt e-mail- en/of Slack-notificaties voor nieuw aangemaakte alerts.
 * Best-effort: een mislukte notificatie mag de sync-pipeline niet laten falen. */
export async function notifyNewAlerts(companyId: string, alerts: AlertWithTopic[]): Promise<void> {
  if (alerts.length === 0) return;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { users: { select: { email: true } } },
  });
  if (!company) return;

  const appUrl = getAppUrl();

  for (const alert of alerts) {
    const topicLabel = alert.topic?.label ?? "Onbekend onderwerp";
    const increasePercentage = Number(alert.increasePercentage);

    if (company.alertEmailEnabled && isEmailConfigured()) {
      const to = company.users.map((u) => u.email);
      try {
        await sendAlertEmail({
          to,
          companyName: company.name,
          topicLabel,
          increasePercentage,
          windowDays: alert.timeWindowDays,
          priority: alert.priority,
          reviewCount: alert.reviewCount,
          aiSuggestion: alert.aiSuggestion,
          appUrl,
        });
      } catch (err) {
        console.error(`E-mailnotificatie mislukt voor alert ${alert.id}:`, err);
      }
    }

    if (company.alertSlackWebhookUrl) {
      try {
        const webhookUrl = decryptSecret(company.alertSlackWebhookUrl);
        await sendAlertSlackMessage({
          webhookUrl,
          companyName: company.name,
          topicLabel,
          increasePercentage,
          windowDays: alert.timeWindowDays,
          priority: alert.priority,
          reviewCount: alert.reviewCount,
          aiSuggestion: alert.aiSuggestion,
          appUrl,
        });
      } catch (err) {
        console.error(`Slack-notificatie mislukt voor alert ${alert.id}:`, err);
      }
    }
  }
}
