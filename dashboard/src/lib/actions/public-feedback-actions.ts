"use server";

import { prisma } from "@/lib/prisma";
import { runPostSubmissionPipeline } from "@/lib/reviews/post-submission";

export interface FeedbackFormState {
  error?: string;
  success?: boolean;
}

/** Publieke server action (geen sessie/login) aangeroepen vanaf het token-gebaseerde
 * feedbackformulier dat klanten via een campagne-mail ontvangen. */
export async function submitFeedbackFormAction(
  _prevState: FeedbackFormState,
  formData: FormData
): Promise<FeedbackFormState> {
  const token = formData.get("token");
  if (typeof token !== "string" || !token) return { error: "Ongeldige link." };

  const recipient = await prisma.campaignRecipient.findUnique({ where: { token } });
  if (!recipient) return { error: "Ongeldige of verlopen link." };
  if (recipient.status === "responded") return { error: "Je hebt al feedback gegeven - bedankt daarvoor!" };
  if (recipient.status === "unsubscribed") return { error: "Deze link is niet meer geldig." };

  const ratingRaw = formData.get("rating");
  const rating = typeof ratingRaw === "string" && ratingRaw ? Number(ratingRaw) : null;
  if (rating !== null && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
    return { error: "Ongeldige score." };
  }

  const textRaw = formData.get("text");
  const text = typeof textRaw === "string" ? textRaw.trim() : "";
  if (!text && rating === null) {
    return { error: "Vul minimaal een score of een toelichting in." };
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: recipient.campaignId } });
  if (!campaign) return { error: "Deze campagne bestaat niet meer." };

  const review = await prisma.review.upsert({
    where: {
      platform_externalReviewId: { platform: "email_campaign", externalReviewId: `campaign-recipient-${recipient.id}` },
    },
    create: {
      companyId: campaign.companyId,
      platform: "email_campaign",
      externalReviewId: `campaign-recipient-${recipient.id}`,
      author: recipient.name ?? "Anonieme klant",
      rating,
      text: text || null,
      postedAt: new Date(),
    },
    update: {},
  });

  await prisma.campaignRecipient.update({
    where: { id: recipient.id },
    data: { status: "responded", respondedAt: new Date(), reviewId: review.id },
  });

  await runPostSubmissionPipeline(campaign.companyId);

  return { success: true };
}
