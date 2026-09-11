import "server-only";

const GRAPH_BASE = "https://graph.instagram.com/v21.0";
// Aantal recente posts waarvan comments worden opgehaald per sync - voorkomt dat een account
// met een lange postgeschiedenis in één run duizenden API-calls veroorzaakt.
const MAX_MEDIA_PER_SYNC = 25;

export interface InstagramComment {
  id: string;
  mediaId: string;
  text: string;
  username: string | null;
  timestamp: string;
}

async function instagramApiFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Instagram API-aanroep mislukt (${response.status}): ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

interface RawMedia {
  id: string;
}

interface RawComment {
  id: string;
  text?: string;
  username?: string;
  timestamp: string;
}

async function listRecentMediaIds(accessToken: string): Promise<string[]> {
  const url = new URL(`${GRAPH_BASE}/me/media`);
  url.searchParams.set("fields", "id");
  url.searchParams.set("limit", String(MAX_MEDIA_PER_SYNC));
  url.searchParams.set("access_token", accessToken);

  const data = await instagramApiFetch<{ data?: RawMedia[] }>(url.toString());
  return (data.data ?? []).map((m) => m.id);
}

async function listCommentsForMedia(accessToken: string, mediaId: string): Promise<InstagramComment[]> {
  const comments: InstagramComment[] = [];
  let nextUrl: string | null = (() => {
    const url = new URL(`${GRAPH_BASE}/${mediaId}/comments`);
    url.searchParams.set("fields", "id,text,username,timestamp");
    url.searchParams.set("access_token", accessToken);
    return url.toString();
  })();

  while (nextUrl) {
    const data: { data?: RawComment[]; paging?: { next?: string } } = await instagramApiFetch(nextUrl);
    for (const comment of data.data ?? []) {
      if (!comment.text) continue; // reacties zonder tekst (bv. alleen een like) leveren geen classificeerbare feedback op
      comments.push({
        id: comment.id,
        mediaId,
        text: comment.text,
        username: comment.username ?? null,
        timestamp: comment.timestamp,
      });
    }
    nextUrl = data.paging?.next ?? null;
  }

  return comments;
}

/** Haalt comments op van de meest recente posts van het gekoppelde Instagram-account. */
export async function listRecentComments(accessToken: string): Promise<InstagramComment[]> {
  const mediaIds = await listRecentMediaIds(accessToken);
  const comments: InstagramComment[] = [];
  for (const mediaId of mediaIds) {
    comments.push(...(await listCommentsForMedia(accessToken, mediaId)));
  }
  return comments;
}

export async function getProfile(accessToken: string): Promise<{ id: string; username: string }> {
  const url = new URL(`${GRAPH_BASE}/me`);
  url.searchParams.set("fields", "id,username");
  url.searchParams.set("access_token", accessToken);
  return instagramApiFetch(url.toString());
}
