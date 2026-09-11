import "server-only";

// TikTok API for Business (business-api.tiktok.com) - LET OP: dit is de minst geverifieerde
// integratie in het project. developers.tiktok.com en business-api.tiktok.com waren beide
// niet rechtstreeks bereikbaar vanuit deze sandbox. De endpoints/parameters hieronder zijn
// samengesteld uit de officiële TikTok Business API SDK-documentatie op GitHub
// (github.com/tiktok/tiktok-business-api-sdk) en meerdere onafhankelijke bronnen, maar zijn
// NOOIT live getest. Belangrijk om te weten voordat je dit inschakelt:
// - Dit vereist een echt TikTok Ads/Business-account (een "advertiser_id"), geen gewoon
//   TikTok-profiel of Creator-account.
// - Test dit als eerste met een testaccount voordat je het op productiedata loslaat.
const AUTHORIZE_URL = "https://business-api.tiktok.com/portal/auth";
const TOKEN_URL = "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/";
const REFRESH_URL = "https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_token/";

export function isTikTokConfigured(): boolean {
  return Boolean(process.env.TIKTOK_APP_ID && process.env.TIKTOK_APP_SECRET && process.env.APP_URL);
}

function getRedirectUri(): string {
  return `${process.env.APP_URL}/api/tiktok/callback`;
}

export function buildTikTokAuthUrl(state: string): string {
  const params = new URLSearchParams({
    app_id: process.env.TIKTOK_APP_ID ?? "",
    state,
    redirect_uri: getRedirectUri(),
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

// TikTok Business API-responses zijn consistent verpakt in {code, message, request_id, data}.
interface TikTokEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

async function tiktokFetch<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = (await response.json()) as TikTokEnvelope<T>;
  if (!response.ok || body.code !== 0) {
    throw new Error(`TikTok API-aanroep mislukt (${response.status}, code ${body.code}): ${body.message}`);
  }
  return body.data;
}

export interface TikTokTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  advertiserIds: string[];
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  advertiser_ids?: string[];
}

export async function exchangeCodeForTokens(code: string): Promise<TikTokTokens> {
  const data = await tiktokFetch<TokenData>(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_APP_ID,
      secret: process.env.TIKTOK_APP_SECRET,
      auth_code: code,
      grant_type: "authorization_code",
    }),
  });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    // Toegangstokens zijn (volgens de SDK-docs) 24 uur geldig, het refresh-token 1 jaar.
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    advertiserIds: data.advertiser_ids ?? [],
  };
}

export interface RefreshedTikTokTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}

export async function refreshAccessToken(refreshToken: string): Promise<RefreshedTikTokTokens> {
  const data = await tiktokFetch<TokenData>(REFRESH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_APP_ID,
      secret: process.env.TIKTOK_APP_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}
