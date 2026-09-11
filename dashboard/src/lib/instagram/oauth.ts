import "server-only";

// Instagram API met Instagram Login ("Business Login for Instagram"), zie
// developers.facebook.com/docs/instagram-platform - dat domein was vanuit deze sandbox niet
// rechtstreeks bereikbaar om live te verifiëren (zelfde beperking als eerder bij Trustpilot).
// Onderstaande endpoints/scopes zijn samengesteld uit meerdere actuele bronnen; controleer dit
// tegen je eigen Meta for Developers-app bij het instellen.
const AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const GRAPH_BASE = "https://graph.instagram.com";
const SCOPES = ["instagram_business_basic", "instagram_business_manage_comments"];

export interface InstagramTokens {
  accessToken: string;
  // Instagram kent geen apart refresh-token: hetzelfde long-lived access-token wordt zelf
  // ververst. We slaan het daarom ook op als "refreshToken" zodat het generieke
  // oauth-token-manager.ts (gedeeld met Google/Trustpilot) ongewijzigd herbruikt kan worden.
  refreshToken: string | null;
  expiresAt: Date;
  igUserId: string;
}

export function isInstagramConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET && process.env.APP_URL);
}

function getRedirectUri(): string {
  return `${process.env.APP_URL}/api/instagram/callback`;
}

export function buildInstagramAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID ?? "",
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(","),
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeLongLivedToken(shortLivedToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
  const url = new URL(`${GRAPH_BASE}/access_token`);
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", process.env.INSTAGRAM_APP_SECRET ?? "");
  url.searchParams.set("access_token", shortLivedToken);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Instagram long-lived tokenuitwisseling mislukt: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiresAt: new Date(Date.now() + data.expires_in * 1000) };
}

/** Wisselt de authorization-code om voor een kortlevend token en direct daarna voor een
 * long-lived token (~60 dagen geldig), zoals voorgeschreven door de Instagram API. */
export async function exchangeCodeForTokens(code: string): Promise<InstagramTokens> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID ?? "",
      client_secret: process.env.INSTAGRAM_APP_SECRET ?? "",
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(),
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Instagram-tokenuitwisseling mislukt: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string; user_id: string | number };
  const longLived = await exchangeLongLivedToken(data.access_token);

  return {
    accessToken: longLived.accessToken,
    refreshToken: longLived.accessToken,
    expiresAt: longLived.expiresAt,
    igUserId: String(data.user_id),
  };
}

export interface RefreshedInstagramTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}

/** Ververst het long-lived access-token (moet minstens 24 uur oud zijn) - er is geen apart
 * refresh-token bij Instagram, vandaar dat hetzelfde token hier zowel in- als output is. */
export async function refreshAccessToken(currentAccessToken: string): Promise<RefreshedInstagramTokens> {
  const url = new URL(`${GRAPH_BASE}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", currentAccessToken);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Instagram-token vernieuwen mislukt: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}
