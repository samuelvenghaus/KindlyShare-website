import "server-only";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/oauth-token-manager";
import { ingestReviews, type IngestResult } from "@/lib/review-ingestion";
import { refreshAccessToken } from "./oauth";
import { listRecentComments } from "./api";

export interface SyncResult extends IngestResult {
  connectionId: string;
  companyId: string;
}

export async function syncInstagramConnection(connectionId: string): Promise<SyncResult> {
  const connection = await prisma.platformConnection.findUniqueOrThrow({ where: { id: connectionId } });

  if (connection.platform !== "instagram") {
    throw new Error("syncInstagramConnection kan alleen op Instagram-koppelingen worden toegepast.");
  }

  const accessToken = await getValidAccessToken(connection, refreshAccessToken);
  const comments = await listRecentComments(accessToken);

  // Instagram-comments hebben geen sterrenscore - relevantie/sentiment komt volledig van de
  // AI-classificatie (zie isRelevant op Review), die "domme" reacties (spam/emoji/tags/grapjes)
  // eruit filtert zodat ze niet meetellen in dashboards, rapporten of alerts.
  const result = await ingestReviews(
    connection.companyId,
    "instagram",
    comments.map((c) => ({
      externalId: c.id,
      authorName: c.username ?? "Instagram-gebruiker",
      rating: null,
      text: c.text,
      postedAt: new Date(c.timestamp),
    }))
  );

  await prisma.platformConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  });

  return { connectionId, companyId: connection.companyId, ...result };
}
