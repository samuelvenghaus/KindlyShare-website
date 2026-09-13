"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseRecipientsText } from "@/lib/campaigns/csv";
import { generateCampaignDraft } from "@/lib/campaigns/draft";
import { sendCampaignInviteEmail, sendCampaignReminderEmail } from "@/lib/campaigns/email";
import { isAiConfigured } from "@/lib/ai/client";

export interface CampaignActionState {
  error?: string;
  success?: string;
  subject?: string;
  body?: string;
}

function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function generateCampaignDraftAction(
  _prevState: CampaignActionState,
  _formData: FormData
): Promise<CampaignActionState> {
  const session = await getSession();
  if (!session) return { error: "Niet ingelogd." };
  if (!isAiConfigured()) return { error: "AI-conceptteksten zijn nog niet geconfigureerd (ANTHROPIC_API_KEY ontbreekt)." };

  const company = await prisma.company.findUniqueOrThrow({ where: { id: session.companyId } });

  try {
    const draft = await generateCampaignDraft({ companyName: company.name });
    return { subject: draft.subject, body: draft.body };
  } catch (err) {
    console.error("AI-conceptmail genereren mislukt:", err);
    return { error: "Genereren van een conceptmail is mislukt. Probeer het opnieuw of schrijf 'm zelf." };
  }
}

const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "Vul een naam voor de campagne in."),
  subject: z.string().trim().min(1, "Vul een onderwerpregel in."),
  body: z.string().trim().min(1, "Vul een e-mailtekst in."),
  senderName: z.string().trim().min(1, "Vul een afzendernaam in."),
  replyToEmail: z.string().trim().email("Vul een geldig antwoordadres in."),
  manualRecipients: z.string().optional(),
});

export async function createCampaignAction(
  _prevState: CampaignActionState,
  formData: FormData
): Promise<CampaignActionState> {
  const session = await getSession();
  if (!session) return { error: "Niet ingelogd." };

  const parsed = createCampaignSchema.safeParse({
    name: formData.get("name"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    senderName: formData.get("senderName"),
    replyToEmail: formData.get("replyToEmail"),
    manualRecipients: formData.get("manualRecipients"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de ingevulde gegevens." };
  }

  const csvFile = formData.get("csvFile");
  let combinedText = parsed.data.manualRecipients ?? "";
  if (csvFile instanceof File && csvFile.size > 0) {
    combinedText += "\n" + (await csvFile.text());
  }

  const recipients = parseRecipientsText(combinedText);
  if (recipients.length === 0) {
    return { error: "Geen geldige e-mailadressen gevonden. Voeg een CSV toe of typ e-mailadressen in." };
  }

  const campaign = await prisma.campaign.create({
    data: {
      companyId: session.companyId,
      name: parsed.data.name,
      subject: parsed.data.subject,
      bodyHtml: parsed.data.body,
      senderName: parsed.data.senderName,
      replyToEmail: parsed.data.replyToEmail,
      status: "draft",
      recipients: {
        create: recipients.map((r) => ({
          email: r.email,
          name: r.name,
          token: generateToken(),
        })),
      },
    },
  });

  revalidatePath("/campagnes");
  redirect(`/campagnes/${campaign.id}`);
}

async function assertOwnedCampaign(campaignId: string) {
  const session = await getSession();
  if (!session) throw new Error("Niet ingelogd.");
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.companyId !== session.companyId) throw new Error("Campagne niet gevonden.");
  return campaign;
}

export async function sendCampaignAction(
  _prevState: CampaignActionState,
  formData: FormData
): Promise<CampaignActionState> {
  const campaignId = formData.get("campaignId");
  if (typeof campaignId !== "string") return { error: "Ongeldige campagne." };

  let campaign;
  try {
    campaign = await assertOwnedCampaign(campaignId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Campagne niet gevonden." };
  }
  if (campaign.status !== "draft") {
    return { error: "Deze campagne is al verstuurd." };
  }

  const company = await prisma.company.findUniqueOrThrow({ where: { id: campaign.companyId } });
  const recipients = await prisma.campaignRecipient.findMany({ where: { campaignId, status: "pending" } });

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: "sending" } });

  const appUrl = getAppUrl();
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    try {
      await sendCampaignInviteEmail({
        to: recipient.email,
        recipientName: recipient.name,
        companyName: company.name,
        senderName: campaign.senderName,
        replyToEmail: campaign.replyToEmail,
        subject: campaign.subject,
        body: campaign.bodyHtml,
        formUrl: `${appUrl}/feedback-formulier/${recipient.token}`,
        unsubscribeUrl: `${appUrl}/afmelden/${recipient.token}`,
        trackingPixelUrl: `${appUrl}/api/campagnes/track/${recipient.token}`,
      });
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { status: "sent", sentAt: new Date() },
      });
      sentCount++;
    } catch (err) {
      console.error(`Campagnemail versturen mislukt voor ${recipient.email}:`, err);
      await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: "bounced" } });
      failedCount++;
    }
  }

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: "sent", sentAt: new Date() } });

  revalidatePath(`/campagnes/${campaignId}`);
  revalidatePath("/campagnes");

  if (sentCount === 0 && failedCount > 0) {
    return { error: `Versturen is voor alle ${failedCount} ontvangers mislukt. Controleer de e-mailconfiguratie.` };
  }
  return {
    success: `Verstuurd naar ${sentCount} ontvanger${sentCount === 1 ? "" : "s"}${failedCount > 0 ? `, ${failedCount} mislukt` : ""}.`,
  };
}

export async function sendCampaignReminderAction(
  _prevState: CampaignActionState,
  formData: FormData
): Promise<CampaignActionState> {
  const campaignId = formData.get("campaignId");
  if (typeof campaignId !== "string") return { error: "Ongeldige campagne." };

  let campaign;
  try {
    campaign = await assertOwnedCampaign(campaignId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Campagne niet gevonden." };
  }

  const company = await prisma.company.findUniqueOrThrow({ where: { id: campaign.companyId } });
  const recipients = await prisma.campaignRecipient.findMany({ where: { campaignId, status: "sent" } });

  if (recipients.length === 0) {
    return { error: "Er zijn geen ontvangers die nog geen feedback hebben gegeven." };
  }

  const appUrl = getAppUrl();
  let sentCount = 0;

  for (const recipient of recipients) {
    try {
      await sendCampaignReminderEmail({
        to: recipient.email,
        recipientName: recipient.name,
        companyName: company.name,
        senderName: campaign.senderName,
        replyToEmail: campaign.replyToEmail,
        subject: campaign.subject,
        body: campaign.bodyHtml,
        formUrl: `${appUrl}/feedback-formulier/${recipient.token}`,
        unsubscribeUrl: `${appUrl}/afmelden/${recipient.token}`,
        trackingPixelUrl: `${appUrl}/api/campagnes/track/${recipient.token}`,
      });
      await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { reminderSentAt: new Date() } });
      sentCount++;
    } catch (err) {
      console.error(`Herinnering versturen mislukt voor ${recipient.email}:`, err);
    }
  }

  revalidatePath(`/campagnes/${campaignId}`);
  return { success: `Herinnering verstuurd naar ${sentCount} ontvanger${sentCount === 1 ? "" : "s"}.` };
}
