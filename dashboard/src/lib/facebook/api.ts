import "server-only";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

async function facebookApiFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Facebook API-aanroep mislukt (${response.status}): ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

export interface FacebookPage {
  id: string;
  name: string;
  // Page access token, geërfd van het long-lived user-token waarmee /me/accounts is aangeroepen.
  accessToken: string;
}

interface RawPage {
  id: string;
  name: string;
  access_token: string;
}

/** Lijst van Facebook-pagina's die de ingelogde gebruiker beheert, elk met een eigen
 * page-access-token (zelfde structuur als Google's accounts→locations). */
export async function listPages(userAccessToken: string): Promise<FacebookPage[]> {
  const url = new URL(`${GRAPH_BASE}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token");
  url.searchParams.set("access_token", userAccessToken);

  const data = await facebookApiFetch<{ data?: RawPage[] }>(url.toString());
  return (data.data ?? []).map((p) => ({ id: p.id, name: p.name, accessToken: p.access_token }));
}

export interface FacebookRating {
  id: string;
  reviewerName: string | null;
  // Facebook toont sinds 2018 geen sterren meer, maar een duim omhoog/omlaag-aanbeveling.
  recommends: boolean | null;
  reviewText: string | null;
  createdTime: string;
}

// Niet live geverifieerd (developers.facebook.com onbereikbaar) - de rating-/aanbevelingsobjecten
// zouden een geneste "open_graph_story.id" als stabiele identifier moeten hebben; we vallen terug
// op reviewer+tijdstip als er geen id aanwezig is, zodat dedupe nooit hard faalt.
interface RawRating {
  id?: string;
  open_graph_story?: { id?: string };
  reviewer?: { name?: string };
  recommendation_type?: "positive" | "negative";
  review_text?: string;
  created_time: string;
}

export async function listRatings(pageAccessToken: string, pageId: string): Promise<FacebookRating[]> {
  const ratings: FacebookRating[] = [];
  let nextUrl: string | null = (() => {
    const url = new URL(`${GRAPH_BASE}/${pageId}/ratings`);
    url.searchParams.set("fields", "open_graph_story,reviewer,recommendation_type,review_text,created_time");
    url.searchParams.set("access_token", pageAccessToken);
    return url.toString();
  })();

  while (nextUrl) {
    const data: { data?: RawRating[]; paging?: { next?: string } } = await facebookApiFetch(nextUrl);
    for (const rating of data.data ?? []) {
      const externalId = rating.open_graph_story?.id ?? rating.id;
      if (!externalId) continue; // zonder stabiele id kunnen we niet dedupliceren, dan liever overslaan
      ratings.push({
        id: externalId,
        reviewerName: rating.reviewer?.name ?? null,
        recommends:
          rating.recommendation_type === "positive"
            ? true
            : rating.recommendation_type === "negative"
              ? false
              : null,
        reviewText: rating.review_text ?? null,
        createdTime: rating.created_time,
      });
    }
    nextUrl = data.paging?.next ?? null;
  }

  return ratings;
}
