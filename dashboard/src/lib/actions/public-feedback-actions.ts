"use server";

import { prisma } from "@/lib/prisma";
import { classifyPendingReviews } from "@/lib/ai/classify";
import { checkAlertThresholds } from "@/lib/ai/alerts";
import { isAiConfigured } from "@/lib/ai/client";
import { notifyNewAlerts } from "@/lib/notifications";

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

  // Net als bij een reguliere kanaal-sync: classificeer direct en controleer alert-drempels,
  // zodat campagne-feedback zonder speciale afhandeling door dezelfde AI-pipeline stroomt.
  if (isAiConfigured()) {
    try {
      await classifyPendingReviews(campaign.companyId);
      const newAlerts = await checkAlertThresholds(campaign.companyId);
      if (newAlerts.length > 0) {
        await notifyNewAlerts(campaign.companyId, newAlerts);
      }
    } catch (err) {
      console.error(`Classificatie/alert-check na campagnefeedback mislukt voor bedrijf ${campaign.companyId}:`, err);
    }
  }

  return { success: true };
}
