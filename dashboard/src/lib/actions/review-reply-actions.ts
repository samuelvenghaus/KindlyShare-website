"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAiConfigured } from "@/lib/ai/client";
import { generateReviewReplyDraft } from "@/lib/ai/reply-draft";
import { canReplyToReview, postReviewReply } from "@/lib/reviews/reply";

export interface ReviewReplyActionState {
  error?: string;
  success?: string;
  draft?: string;
}

async function assertOwnedReview(reviewId: string, companyId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.companyId !== companyId) {
    throw new Error("Review niet gevonden.");
  }
  return review;
}

export async function generateReviewReplyDraftAction(
  _prevState: ReviewReplyActionState,
  formData: FormData
): Promise<ReviewReplyActionState> {
  const session = await getSession();
  if (!session) return { error: "Niet ingelogd." };
  if (!isAiConfigured()) return { error: "AI-conceptantwoorden zijn nog niet geconfigureerd (ANTHROPIC_API_KEY ontbreekt)." };

  const reviewId = formData.get("reviewId");
  if (typeof reviewId !== "string") return { error: "Ongeldige review." };

  let review;
  try {
    review = await assertOwnedReview(reviewId, session.companyId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Review niet gevonden." };
  }
  if (!review.text) return { error: "Deze review heeft geen tekst om op te reageren." };

  const company = await prisma.company.findUniqueOrThrow({ where: { id: session.companyId } });

  try {
    const draft = await generateReviewReplyDraft({
      companyName: company.name,
      reviewText: review.text,
      rating: review.rating !== null ? Number(review.rating) : null,
      sentiment: review.sentiment,
    });
    return { draft };
  } catch (err) {
    console.error("AI-conceptantwoord genereren mislukt:", err);
    return { error: "Genereren van een conceptantwoord is mislukt. Probeer het opnieuw of schrijf het zelf." };
  }
}

const postReplySchema = z.object({
  reviewId: z.string().min(1),
  replyText: z.string().trim().min(1, "Vul een antwoord in."),
});

export async function postReviewReplyAction(
  _prevState: ReviewReplyActionState,
  formData: FormData
): Promise<ReviewReplyActionState> {
  const session = await getSession();
  if (!session) return { error: "Niet ingelogd." };

  const parsed = postReplySchema.safeParse({
    reviewId: formData.get("reviewId"),
    replyText: formData.get("replyText"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de ingevulde gegevens." };
  }

  let review;
  try {
    review = await assertOwnedReview(parsed.data.reviewId, session.companyId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Review niet gevonden." };
  }

  if (!canReplyToReview(review.platform)) {
    return { error: "Reageren wordt voor dit platform nog niet ondersteund." };
  }
  if (!review.connectionId) {
    return { error: "Onbekend via welke koppeling deze review is opgehaald - koppel dit kanaal opnieuw." };
  }

  const connection = await prisma.platformConnection.findUnique({ where: { id: review.connectionId } });
  if (!connection || connection.status !== "active") {
    return { error: "De koppeling voor dit kanaal is niet (meer) actief." };
  }

  try {
    await postReviewReply(review, connection, parsed.data.replyText);
  } catch (err) {
    console.error(`Antwoord posten mislukt voor review ${review.id}:`, err);
    return { error: err instanceof Error ? err.message : "Antwoord versturen is mislukt." };
  }

  await prisma.review.update({
    where: { id: review.id },
    data: { replyText: parsed.data.replyText, repliedAt: new Date() },
  });

  revalidatePath("/feedback");
  return { success: "Antwoord geplaatst." };
}
