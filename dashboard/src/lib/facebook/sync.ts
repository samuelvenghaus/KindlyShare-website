import "server-only";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/oauth-token-manager";
import { ingestReviews, type IngestResult } from "@/lib/review-ingestion";
import { refreshAccessToken } from "./oauth";
import { listRatings } from "./api";

export interface SyncResult extends IngestResult {
  connectionId: string;
  companyId: string;
}

export async function syncFacebookConnection(connectionId: string): Promise<SyncResult> {
  const connection = await prisma.platformConnection.findUniqueOrThrow({ where: { id: connectionId } });

  if (connection.platform !== "facebook") {
    throw new Error("syncFacebookConnection kan alleen op Facebook-koppelingen worden toegepast.");
  }
  if (!connection.externalAccountId) {
    throw new Error("Koppeling heeft geen external_account_id.");
  }

  const accessToken = await getValidAccessToken(connection, refreshAccessToken);
  const ratings = await listRatings(accessToken, connection.externalAccountId);

  // Facebook toont geen sterren meer, alleen een aanbeveling (duim omhoog/omlaag) - die zetten
  // we om naar een 5/1-score zodat de bestaande sentiment-fallback (op basis van rating) ook
  // werkt voor reviews die nog niet door AI geclassificeerd zijn.
  const result = await ingestReviews(
    connection.companyId,
    "facebook",
    ratings.map((r) => ({
      externalId: r.id,
      authorName: r.reviewerName ?? "Facebook-gebruiker",
      rating: r.recommends === true ? 5 : r.recommends === false ? 1 : null,
      text: r.reviewText,
      postedAt: new Date(r.createdTime),
    }))
  );

  await prisma.platformConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  });

  return { connectionId, companyId: connection.companyId, ...result };
}
