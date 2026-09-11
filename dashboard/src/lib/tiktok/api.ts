import "server-only";

const API_BASE = "https://business-api.tiktok.com/open_api/v1.3";
const WINDOW_DAYS = 30;

interface TikTokEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

async function tiktokApiFetch<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "Access-Token": accessToken },
  });
  const body = (await response.json()) as TikTokEnvelope<T>;
  if (!response.ok || body.code !== 0) {
    throw new Error(`TikTok API-aanroep mislukt (${response.status}, code ${body.code}): ${body.message}`);
  }
  return body.data;
}

function formatTikTokDate(date: Date): string {
  // TikTok Business API-datumvelden gebruiken doorgaans "YYYY-MM-DD"-notatie voor rapportage-
  // vensters - niet live geverifieerd, controleer dit als de sync een datum-gerelateerde
  // API-fout teruggeeft.
  return date.toISOString().slice(0, 10);
}

export interface TikTokComment {
  id: string;
  authorName: string | null;
  text: string;
  createdAt: Date;
}

// LET OP - het minst geverifieerde stuk van deze integratie: de officiële SDK-documentatie
// noemt advertiser_id, start_time, end_time, search_field en search_value als verplichte
// parameters voor /comment/list/, maar de exacte toegestane waarden voor search_field/
// search_value (bv. filteren op video, op status, of "alles") en de precieze veldnamen in de
// response (comment_id/text/create_time hieronder zijn een educated guess op basis van TikTok's
// gangbare snake_case-conventie) waren niet live te verifiëren. Test dit eerst met een
// testaccount en pas de response-mapping aan zodra de echte API-vorm bekend is.
interface RawComment {
  comment_id?: string;
  id?: string;
  text?: string;
  content?: string;
  create_time?: string | number;
  nick_name?: string;
  user_name?: string;
}

export async function listRecentComments(accessToken: string, advertiserId: string): Promise<TikTokComment[]> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const url = new URL(`${API_BASE}/comment/list/`);
  url.searchParams.set("advertiser_id", advertiserId);
  url.searchParams.set("start_time", formatTikTokDate(windowStart));
  url.searchParams.set("end_time", formatTikTokDate(now));
  // Best-effort default zodat de aanroep syntactisch geldig is; pas aan zodra bekend is welke
  // search_field-waarden TikTok werkelijk accepteert voor "alle comments van dit account".
  url.searchParams.set("search_field", "CREATE_TIME");
  url.searchParams.set("search_value", "");
  url.searchParams.set("page_size", "100");

  const data = await tiktokApiFetch<{ comments?: RawComment[]; list?: RawComment[] }>(url.toString(), accessToken);
  const rawComments = data.comments ?? data.list ?? [];

  const comments: TikTokComment[] = [];
  for (const raw of rawComments) {
    const id = raw.comment_id ?? raw.id;
    const text = raw.text ?? raw.content;
    if (!id || !text) continue;

    const createTime = raw.create_time;
    const createdAt =
      typeof createTime === "number"
        ? new Date(createTime * 1000)
        : typeof createTime === "string" && createTime
          ? new Date(createTime)
          : now;

    comments.push({
      id,
      authorName: raw.nick_name ?? raw.user_name ?? null,
      text,
      createdAt,
    });
  }

  return comments;
}
