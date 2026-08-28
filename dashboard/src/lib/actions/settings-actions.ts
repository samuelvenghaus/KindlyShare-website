"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { sendAlertSlackMessage } from "@/lib/notifications/slack";

export interface SettingsActionState {
  error?: string;
  success?: string;
}

const companyNameSchema = z.object({
  name: z.string().trim().min(1, "Vul een bedrijfsnaam in.").max(200),
});

export async function updateCompanyNameAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session) return { error: "Niet ingelogd." };

  const parsed = companyNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige bedrijfsnaam." };
  }

  await prisma.company.update({
    where: { id: session.companyId },
    data: { name: parsed.data.name },
  });

  revalidatePath("/instellingen");
  return { success: "Bedrijfsnaam bijgewerkt." };
}

const notificationSettingsSchema = z.object({
  alertEmailEnabled: z.literal("on").optional(),
  slackWebhookUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || v.startsWith("https://hooks.slack.com/"), {
      message: "Dit lijkt geen geldige Slack incoming-webhook-URL (moet beginnen met https://hooks.slack.com/).",
    })
    .optional(),
});

export async function updateNotificationSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session) return { error: "Niet ingelogd." };

  const parsed = notificationSettingsSchema.safeParse({
    alertEmailEnabled: formData.get("alertEmailEnabled") ?? undefined,
    slackWebhookUrl: formData.get("slackWebhookUrl") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de ingevulde gegevens." };
  }

  const slackWebhookUrl = parsed.data.slackWebhookUrl ?? "";

  await prisma.company.update({
    where: { id: session.companyId },
    data: {
      alertEmailEnabled: parsed.data.alertEmailEnabled === "on",
      alertSlackWebhookUrl: slackWebhookUrl ? encryptSecret(slackWebhookUrl) : null,
    },
  });

  revalidatePath("/instellingen");
  return { success: "Notificatie-instellingen opgeslagen." };
}

export async function sendTestSlackNotificationAction(
  _prevState: SettingsActionState,
  _formData: FormData
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session) return { error: "Niet ingelogd." };

  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  if (!company?.alertSlackWebhookUrl) {
    return { error: "Er is nog geen Slack-webhook ingesteld. Sla deze eerst op." };
  }

  try {
    await sendAlertSlackMessage({
      webhookUrl: decryptSecret(company.alertSlackWebhookUrl),
      companyName: company.name,
      topicLabel: "Testmelding",
      increasePercentage: 42,
      windowDays: 3,
      priority: "medium",
      reviewCount: 5,
      aiSuggestion: "Dit is een testbericht vanuit KindlyShare Instellingen.",
      appUrl: process.env.APP_URL ?? "http://localhost:3000",
    });
    return { success: "Testbericht verstuurd naar Slack." };
  } catch (err) {
    console.error("Slack-testbericht mislukt:", err);
    return { error: err instanceof Error ? err.message : "Versturen van testbericht is mislukt." };
  }
}
