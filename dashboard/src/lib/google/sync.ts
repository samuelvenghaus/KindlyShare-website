import "server-only";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/oauth-token-manager";
import { ingestReviews, type IngestResult } from "@/lib/review-ingestion";
import { refreshAccessToken } from "./oauth";
import { listReviews } from "./business-profile";

export interface SyncResult extends IngestResult {
  connectionId: string;
  companyId: string;
}

export async function syncGoogleConnection(connectionId: string): Promise<SyncResult> {
  const connection = await prisma.platformConnection.findUniqueOrThrow({ where: { id: connectionId } });

  if (connection.platform !== "google") {
    throw new Error("syncGoogleConnection kan alleen op Google-koppelingen worden toegepast.");
  }
  if (!connection.externalAccountId) {
    throw new Error("Koppeling heeft geen external_account_id.");
  }

  const accessToken = await getValidAccessToken(connection, refreshAccessToken);
  const reviews = await listReviews(accessToken, connection.externalAccountId);

  const result = await ingestReviews(
    connection.companyId,
    "google",
    reviews.map((r) => ({
      externalId: r.reviewId,
      authorName: r.authorName,
      rating: r.rating,
      text: r.comment,
      postedAt: new Date(r.createTime),
    })),
    connection.id
  );

  await prisma.platformConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  });

  return { connectionId, companyId: connection.companyId, ...result };
}
