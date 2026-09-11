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

export async function syncTikTokConnection(connectionId: string): Promise<SyncResult> {
  const connection = await prisma.platformConnection.findUniqueOrThrow({ where: { id: connectionId } });

  if (connection.platform !== "tiktok") {
    throw new Error("syncTikTokConnection kan alleen op TikTok-koppelingen worden toegepast.");
  }
  if (!connection.externalAccountId) {
    throw new Error("Koppeling heeft geen external_account_id (advertiser_id).");
  }

  const accessToken = await getValidAccessToken(connection, refreshAccessToken);
  const comments = await listRecentComments(accessToken, connection.externalAccountId);

  // Net als bij Instagram: TikTok-comments hebben geen sterrenscore en zijn extra gevoelig voor
  // ruis (spam/emoji/grapjes) - de AI-relevantiecheck (isRelevant) filtert dit eruit voordat het
  // meetelt in dashboards, rapporten of alerts.
  const result = await ingestReviews(
    connection.companyId,
    "tiktok",
    comments.map((c) => ({
      externalId: c.id,
      authorName: c.authorName ?? "TikTok-gebruiker",
      rating: null,
      text: c.text,
      postedAt: c.createdAt,
    }))
  );

  await prisma.platformConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  });

  return { connectionId, companyId: connection.companyId, ...result };
}
