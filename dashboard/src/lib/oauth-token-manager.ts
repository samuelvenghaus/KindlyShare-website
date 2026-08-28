import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import type { PlatformConnection } from "@/generated/prisma/client";

const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minuten marge voor klokverschil/latency

export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}

/**
 * Generieke OAuth-tokenopslag/-refresh, herbruikbaar per platform (adapter-patroon):
 * geeft een geldig access-token terug en vernieuwt + persisteert het indien verlopen,
 * via de door de aanroeper meegegeven platform-specifieke refresh-functie.
 */
export async function getValidAccessToken(
  connection: PlatformConnection,
  refreshFn: (refreshToken: string) => Promise<RefreshedTokens>
): Promise<string> {
  const stillValid =
    connection.accessToken &&
    connection.tokenExpiresAt &&
    connection.tokenExpiresAt.getTime() - EXPIRY_BUFFER_MS > Date.now();

  if (stillValid) {
    return decryptSecret(connection.accessToken!);
  }

  if (!connection.refreshToken) {
    throw new Error("Geen refresh-token beschikbaar; koppel dit kanaal opnieuw.");
  }

  const refreshToken = decryptSecret(connection.refreshToken);
  const tokens = await refreshFn(refreshToken);

  await prisma.platformConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: encryptSecret(tokens.accessToken),
      ...(tokens.refreshToken ? { refreshToken: encryptSecret(tokens.refreshToken) } : {}),
      tokenExpiresAt: tokens.expiresAt,
    },
  });

  return tokens.accessToken;
}
