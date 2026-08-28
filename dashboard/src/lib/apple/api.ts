import "server-only";

// Bevestigd via developer.apple.com (App Store Connect API).
const API_BASE = "https://api.appstoreconnect.apple.com/v1";

export interface AppleReview {
  reviewId: string;
  authorName: string;
  rating: number | null;
  text: string | null;
  createdAt: string;
}

interface RawReview {
  id: string;
  attributes?: {
    rating?: number;
    title?: string;
    body?: string;
    reviewerNickname?: string;
    createdDate?: string;
  };
}

export async function listReviews(token: string, appId: string): Promise<AppleReview[]> {
  const reviews: AppleReview[] = [];
  let url: string | null =
    `${API_BASE}/apps/${appId}/customerReviews?limit=200&sort=-createdDate&include=response`;

  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`App Store Connect API-aanroep mislukt (${response.status}): ${await response.text()}`);
    }

    const data = (await response.json()) as { data?: RawReview[]; links?: { next?: string } };

    for (const review of data.data ?? []) {
      reviews.push({
        reviewId: review.id,
        authorName: review.attributes?.reviewerNickname ?? "Anonieme gebruiker",
        rating: review.attributes?.rating ?? null,
        text: review.attributes?.body ?? review.attributes?.title ?? null,
        createdAt: review.attributes?.createdDate ?? new Date().toISOString(),
      });
    }

    url = data.links?.next ?? null;
  }

  return reviews;
}
