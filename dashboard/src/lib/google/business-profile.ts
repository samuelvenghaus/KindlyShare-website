import "server-only";

const ACCOUNT_MGMT_BASE = "https://mybusinessaccountmanagement.googleapis.com/v1";
const BUSINESS_INFO_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
// Legacy Google My Business API v4 — het enige endpoint dat reviews levert.
// Toegang hiertoe moet apart bij Google aangevraagd worden.
const MY_BUSINESS_V4_BASE = "https://mybusiness.googleapis.com/v4";

export interface GoogleAccount {
  name: string; // bv. "accounts/123456789"
  accountName: string;
}

export interface GoogleLocation {
  name: string; // bv. "locations/987654321"
  title: string;
}

export interface GoogleReview {
  reviewId: string;
  authorName: string;
  rating: number | null;
  comment: string | null;
  createTime: string;
}

const STAR_RATING_MAP: Record<string, number | null> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  STAR_RATING_UNSPECIFIED: null,
};

async function googleApiFetch<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Google API-aanroep mislukt (${response.status}): ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

export async function listAccounts(accessToken: string): Promise<GoogleAccount[]> {
  const data = await googleApiFetch<{ accounts?: GoogleAccount[] }>(
    `${ACCOUNT_MGMT_BASE}/accounts`,
    accessToken
  );
  return data.accounts ?? [];
}

export async function listLocations(accessToken: string, accountName: string): Promise<GoogleLocation[]> {
  const data = await googleApiFetch<{ locations?: GoogleLocation[] }>(
    `${BUSINESS_INFO_BASE}/${accountName}/locations?readMask=name,title`,
    accessToken
  );
  return data.locations ?? [];
}

interface RawReview {
  reviewId: string;
  reviewer?: { displayName?: string };
  starRating?: string;
  comment?: string;
  createTime: string;
}

/**
 * @param resourceName Volledig pad "accounts/{accountId}/locations/{locationId}",
 * zoals opgeslagen in platform_connections.external_account_id.
 */
export async function listReviews(accessToken: string, resourceName: string): Promise<GoogleReview[]> {
  const reviews: GoogleReview[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${MY_BUSINESS_V4_BASE}/${resourceName}/reviews`);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const data = await googleApiFetch<{ reviews?: RawReview[]; nextPageToken?: string }>(
      url.toString(),
      accessToken
    );

    for (const review of data.reviews ?? []) {
      reviews.push({
        reviewId: review.reviewId,
        authorName: review.reviewer?.displayName ?? "Anonieme gebruiker",
        rating: review.starRating ? (STAR_RATING_MAP[review.starRating] ?? null) : null,
        comment: review.comment ?? null,
        createTime: review.createTime,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return reviews;
}
