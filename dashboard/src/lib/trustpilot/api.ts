import "server-only";

// Best-effort endpoint op basis van Trustpilot's gedocumenteerde v1 Service Reviews API
// (niet live geverifieerd in deze sandbox - developers.trustpilot.com was niet bereikbaar).
// Controleer dit tegen de actuele Trustpilot-documentatie voordat je hierop vertrouwt.
const API_BASE = "https://api.trustpilot.com/v1";

export interface TrustpilotReview {
  reviewId: string;
  authorName: string;
  rating: number | null;
  text: string | null;
  createdAt: string;
}

interface RawReview {
  id: string;
  stars?: number;
  text?: string;
  consumer?: { displayName?: string };
  createdAt: string;
}

export async function listReviews(accessToken: string, businessUnitId: string): Promise<TrustpilotReview[]> {
  const reviews: TrustpilotReview[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = new URL(`${API_BASE}/business-units/${businessUnitId}/reviews`);
    url.searchParams.set("perPage", String(perPage));
    url.searchParams.set("page", String(page));

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Trustpilot API-aanroep mislukt (${response.status}): ${await response.text()}`);
    }

    const data = (await response.json()) as { reviews?: RawReview[] };
    const pageReviews = data.reviews ?? [];

    for (const review of pageReviews) {
      reviews.push({
        reviewId: review.id,
        authorName: review.consumer?.displayName ?? "Anonieme gebruiker",
        rating: review.stars ?? null,
        text: review.text ?? null,
        createdAt: review.createdAt,
      });
    }

    if (pageReviews.length < perPage) break;
    page++;
  }

  return reviews;
}

// Best-effort endpoint op basis van Trustpilot's gedocumenteerde Business Reviews API
// (niet live geverifieerd in deze sandbox - zelfde beperking als listReviews hierboven).
// Controleer dit tegen de actuele Trustpilot-documentatie voordat je hierop vertrouwt.
export async function replyToReview(accessToken: string, businessUnitId: string, reviewId: string, message: string): Promise<void> {
  const response = await fetch(`${API_BASE}/business-units/${businessUnitId}/reviews/${reviewId}/reply`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    throw new Error(`Antwoord plaatsen op Trustpilot mislukt (${response.status}): ${await response.text()}`);
  }
}
