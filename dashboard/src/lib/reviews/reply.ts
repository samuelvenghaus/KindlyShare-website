import "server-only";
import type { PlatformConnection, Review } from "@/generated/prisma/client";
import type { Platform } from "@/lib/types";
import { getValidAccessToken } from "@/lib/oauth-token-manager";
import { refreshAccessToken as refreshGoogleToken } from "@/lib/google/oauth";
import { replyToReview as replyToGoogleReview } from "@/lib/google/business-profile";
import { refreshAccessToken as refreshTrustpilotToken } from "@/lib/trustpilot/oauth";
import { replyToReview as replyToTrustpilotReview } from "@/lib/trustpilot/api";

// Platforms waarvan de API het programmatisch beantwoorden van een review ondersteunt.
// Overige platforms (App Store, Instagram, Facebook, TikTok, campagne-feedback) niet -
// daar biedt geen van de gekoppelde API's een vergelijkbaar "reply"-endpoint.
const REPLIABLE_PLATFORMS: Platform[] = ["google", "trustpilot"];

export function canReplyToReview(platform: Platform): boolean {
  return REPLIABLE_PLATFORMS.includes(platform);
}

/** Post een antwoord op de review terug naar het bronplatform, via de koppeling waarmee
 * de review oorspronkelijk is opgehaald. */
export async function postReviewReply(review: Review, connection: PlatformConnection, replyText: string): Promise<void> {
  if (!connection.externalAccountId) {
    throw new Error("Koppeling heeft geen account-/locatie-ID.");
  }

  switch (review.platform) {
    case "google": {
      const accessToken = await getValidAccessToken(connection, refreshGoogleToken);
      await replyToGoogleReview(accessToken, connection.externalAccountId, review.externalReviewId, replyText);
      return;
    }
    case "trustpilot": {
      const accessToken = await getValidAccessToken(connection, refreshTrustpilotToken);
      await replyToTrustpilotReview(accessToken, connection.externalAccountId, review.externalReviewId, replyText);
      return;
    }
    default:
      throw new Error(`Reageren wordt niet ondersteund voor platform "${review.platform}".`);
  }
}
