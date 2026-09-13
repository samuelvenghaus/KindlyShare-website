import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { ingestReviews, type IngestResult } from "@/lib/review-ingestion";
import { generateAppStoreConnectToken } from "./jwt";
import { listReviews } from "./api";

export interface SyncResult extends IngestResult {
  connectionId: string;
  companyId: string;
}

export async function syncAppleConnection(connectionId: string): Promise<SyncResult> {
  const connection = await prisma.platformConnection.findUniqueOrThrow({ where: { id: connectionId } });

  if (connection.platform !== "app_store") {
    throw new Error("syncAppleConnection kan alleen op App Store-koppelingen worden toegepast.");
  }
  if (!connection.externalAccountId || !connection.appleKeyId || !connection.appleIssuerId || !connection.accessToken) {
    throw new Error("Koppeling mist App Store Connect-credentials.");
  }

  const privateKey = decryptSecret(connection.accessToken);
  const token = generateAppStoreConnectToken(connection.appleIssuerId, connection.appleKeyId, privateKey);
  const reviews = await listReviews(token, connection.externalAccountId);

  const result = await ingestReviews(
    connection.companyId,
    "app_store",
    reviews.map((r) => ({
      externalId: r.reviewId,
      authorName: r.authorName,
      rating: r.rating,
      text: r.text,
      postedAt: new Date(r.createdAt),
    })),
    connection.id
  );

  await prisma.platformConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  });

  return { connectionId, companyId: connection.companyId, ...result };
}
