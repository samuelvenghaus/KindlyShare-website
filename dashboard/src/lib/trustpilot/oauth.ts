import "server-only";

// Bevestigd via Trustpilot's documentatie/zoekresultaten (developers.trustpilot.com
// was vanuit deze sandbox niet rechtstreeks bereikbaar om live te verifiëren):
// - authorize: https://authenticate.trustpilot.com?client_id=...&redirect_uri=...&response_type=code
// - token: https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken
//   (POST, Basic-auth met apiKey:apiSecret)
// Controleer dit tegen je eigen Trustpilot Business-dashboard bij het instellen.
const AUTHORIZE_URL = "https://authenticate.trustpilot.com";
const TOKEN_URL = "https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken";

export interface TrustpilotTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}

export function isTrustpilotConfigured(): boolean {
  return Boolean(process.env.TRUSTPILOT_API_KEY && process.env.TRUSTPILOT_API_SECRET && process.env.APP_URL);
}

function getRedirectUri(): string {
  return `${process.env.APP_URL}/api/trustpilot/callback`;
}

export function buildTrustpilotAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.TRUSTPILOT_API_KEY ?? "",
    redirect_uri: getRedirectUri(),
    response_type: "code",
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

function basicAuthHeader(): string {
  const credentials = `${process.env.TRUSTPILOT_API_KEY ?? ""}:${process.env.TRUSTPILOT_API_SECRET ?? ""}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

function tokensFromResponse(data: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}): TrustpilotTokens {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function exchangeCodeForTokens(code: string): Promise<TrustpilotTokens> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Trustpilot-tokenuitwisseling mislukt: ${response.status} ${await response.text()}`);
  }

  return tokensFromResponse(await response.json());
}

export async function refreshAccessToken(refreshToken: string): Promise<TrustpilotTokens> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Trustpilot-token vernieuwen mislukt: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return { ...tokensFromResponse(data), refreshToken: data.refresh_token ?? refreshToken };
}
