import "server-only";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "./token-manager";
import { listReviews } from "./business-profile";

export interface SyncResult {
  connectionId: string;
  companyId: string;
  fetched: number;
  created: number;
  updated: number;
}

export async function syncGoogleConnection(connectionId: string): Promise<SyncResult> {
  const connection = await prisma.platformConnection.findUniqueOrThrow({ where: { id: connectionId } });

  if (connection.platform !== "google") {
    throw new Error("syncGoogleConnection kan alleen op Google-koppelingen worden toegepast.");
  }
  if (!connection.externalAccountId) {
    throw new Error("Koppeling heeft geen external_account_id.");
  }

  const accessToken = await getValidAccessToken(connection);
  const reviews = await listReviews(accessToken, connection.externalAccountId);

  const externalIds = reviews.map((r) => r.reviewId);
  const existing = await prisma.review.findMany({
    where: { platform: "google", externalReviewId: { in: externalIds } },
    select: { externalReviewId: true },
  });
  const existingIds = new Set(existing.map((r) => r.externalReviewId));

  let created = 0;
  let updated = 0;

  for (const review of reviews) {
    await prisma.review.upsert({
      where: {
        platform_externalReviewId: {
          platform: "google",
          externalReviewId: review.reviewId,
        },
      },
      create: {
        companyId: connection.companyId,
        platform: "google",
        externalReviewId: review.reviewId,
        author: review.authorName,
        rating: review.rating,
        text: review.comment,
        postedAt: new Date(review.createTime),
      },
      update: {
        author: review.authorName,
        rating: review.rating,
        text: review.comment,
      },
    });

    if (existingIds.has(review.reviewId)) {
      updated++;
    } else {
      created++;
    }
  }

  await prisma.platformConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  });

  return { connectionId, companyId: connection.companyId, fetched: reviews.length, created, updated };
}
