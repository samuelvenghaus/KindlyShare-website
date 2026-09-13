import "server-only";
import { prisma } from "@/lib/prisma";
import type { CampaignRecipientStatus, CampaignStatus } from "@/generated/prisma/client";

export interface CampaignListItem {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  createdAt: Date;
  sentAt: Date | null;
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  respondedCount: number;
  unsubscribedCount: number;
}

function countByStatus(recipients: { status: CampaignRecipientStatus; openedAt: Date | null }[], status: CampaignRecipientStatus) {
  return recipients.filter((r) => r.status === status).length;
}

export async function listCampaigns(companyId: string): Promise<CampaignListItem[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { recipients: { select: { status: true, openedAt: true } } },
  });

  return campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    status: c.status,
    createdAt: c.createdAt,
    sentAt: c.sentAt,
    totalRecipients: c.recipients.length,
    sentCount: c.recipients.filter((r) => r.status !== "pending").length,
    openedCount: c.recipients.filter((r) => r.openedAt !== null).length,
    respondedCount: countByStatus(c.recipients, "responded"),
    unsubscribedCount: countByStatus(c.recipients, "unsubscribed"),
  }));
}

export interface CampaignRecipientItem {
  id: string;
  email: string;
  name: string | null;
  status: CampaignRecipientStatus;
  sentAt: Date | null;
  openedAt: Date | null;
  reminderSentAt: Date | null;
  respondedAt: Date | null;
}

export interface CampaignDetail {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  senderName: string;
  replyToEmail: string;
  status: CampaignStatus;
  createdAt: Date;
  sentAt: Date | null;
  recipients: CampaignRecipientItem[];
}

export async function getCampaign(companyId: string, campaignId: string): Promise<CampaignDetail | null> {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, companyId },
    include: { recipients: { orderBy: { email: "asc" } } },
  });
  if (!campaign) return null;

  return {
    id: campaign.id,
    name: campaign.name,
    subject: campaign.subject,
    bodyHtml: campaign.bodyHtml,
    senderName: campaign.senderName,
    replyToEmail: campaign.replyToEmail,
    status: campaign.status,
    createdAt: campaign.createdAt,
    sentAt: campaign.sentAt,
    recipients: campaign.recipients.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      status: r.status,
      sentAt: r.sentAt,
      openedAt: r.openedAt,
      reminderSentAt: r.reminderSentAt,
      respondedAt: r.respondedAt,
    })),
  };
}
