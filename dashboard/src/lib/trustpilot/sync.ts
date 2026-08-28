import "server-only";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/oauth-token-manager";
import { ingestReviews, type IngestResult } from "@/lib/review-ingestion";
import { refreshAccessToken } from "./oauth";
import { listReviews } from "./api";

export interface SyncResult extends IngestResult {
  connectionId: string;
  companyId: string;
}

export async function syncTrustpilotConnection(connectionId: string): Promise<SyncResult> {
  const connection = await prisma.platformConnection.findUniqueOrThrow({ where: { id: connectionId } });

  if (connection.platform !== "trustpilot") {
    throw new Error("syncTrustpilotConnection kan alleen op Trustpilot-koppelingen worden toegepast.");
  }
  if (!connection.externalAccountId) {
    throw new Error("Koppeling heeft geen business unit ID (external_account_id).");
  }

  const accessToken = await getValidAccessToken(connection, refreshAccessToken);
  const reviews = await listReviews(accessToken, connection.externalAccountId);

  const result = await ingestReviews(
    connection.companyId,
    "trustpilot",
    reviews.map((r) => ({
      externalId: r.reviewId,
      authorName: r.authorName,
      rating: r.rating,
      text: r.text,
      postedAt: new Date(r.createdAt),
    }))
  );

  await prisma.platformConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  });

  return { connectionId, companyId: connection.companyId, ...result };
}
