"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { runPostSubmissionPipeline } from "@/lib/reviews/post-submission";

export interface WidgetFeedbackFormState {
  error?: string;
  success?: boolean;
}

/** Publieke server action (geen sessie/login) aangeroepen vanaf de embed-widget die
 * bedrijven op hun eigen website plaatsen. */
export async function submitWidgetFeedbackAction(
  _prevState: WidgetFeedbackFormState,
  formData: FormData
): Promise<WidgetFeedbackFormState> {
  const companyToken = formData.get("companyToken");
  if (typeof companyToken !== "string" || !companyToken) return { error: "Ongeldige widget." };

  const company = await prisma.company.findUnique({ where: { widgetToken: companyToken } });
  if (!company) return { error: "Ongeldige of verlopen widget-link." };

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

  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";

  await prisma.review.create({
    data: {
      companyId: company.id,
      platform: "widget",
      externalReviewId: `widget-${randomBytes(12).toString("hex")}`,
      author: name || "Anonieme bezoeker",
      rating,
      text: text || null,
      postedAt: new Date(),
    },
  });

  await runPostSubmissionPipeline(company.id);

  return { success: true };
}
