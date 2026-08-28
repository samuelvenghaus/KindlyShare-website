import "server-only";
import { prisma } from "@/lib/prisma";
import type { Platform } from "@/lib/types";

export interface NormalizedReview {
  externalId: string;
  authorName: string;
  rating: number | null;
  text: string | null;
  postedAt: Date;
}

export interface IngestResult {
  fetched: number;
  created: number;
  updated: number;
}

/** Upsert + dedupe op (platform, externalReviewId) - gedeeld door alle platform-adapters. */
export async function ingestReviews(
  companyId: string,
  platform: Platform,
  reviews: NormalizedReview[]
): Promise<IngestResult> {
  const externalIds = reviews.map((r) => r.externalId);
  const existing = await prisma.review.findMany({
    where: { platform, externalReviewId: { in: externalIds } },
    select: { externalReviewId: true },
  });
  const existingIds = new Set(existing.map((r) => r.externalReviewId));

  let created = 0;
  let updated = 0;

  for (const review of reviews) {
    await prisma.review.upsert({
      where: { platform_externalReviewId: { platform, externalReviewId: review.externalId } },
      create: {
        companyId,
        platform,
        externalReviewId: review.externalId,
        author: review.authorName,
        rating: review.rating,
        text: review.text,
        postedAt: review.postedAt,
      },
      update: { author: review.authorName, rating: review.rating, text: review.text },
    });

    if (existingIds.has(review.externalId)) {
      updated++;
    } else {
      created++;
    }
  }

  return { fetched: reviews.length, created, updated };
}
