import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { refreshAccessToken } from "./oauth";
import type { PlatformConnection } from "@/generated/prisma/client";

const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minuten marge voor klokverschil/latency

/** Geeft een geldig access-token terug, en vernieuwt + persisteert het indien verlopen. */
export async function getValidAccessToken(connection: PlatformConnection): Promise<string> {
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
  const tokens = await refreshAccessToken(refreshToken);

  await prisma.platformConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: encryptSecret(tokens.accessToken),
      tokenExpiresAt: tokens.expiresAt,
    },
  });

  return tokens.accessToken;
}
