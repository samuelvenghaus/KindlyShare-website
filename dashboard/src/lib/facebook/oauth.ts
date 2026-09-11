import "server-only";

// Facebook Login for Business (developers.facebook.com/docs/facebook-login) - dat domein was
// vanuit deze sandbox niet rechtstreeks bereikbaar om live te verifiëren (zelfde beperking als
// bij Trustpilot/Instagram). Onderstaande endpoints/scopes komen overeen met de gangbare,
// stabiele Facebook Login-conventie; controleer dit tegen je eigen Meta for Developers-app.
const GRAPH_VERSION = "v21.0";
const AUTHORIZE_URL = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;
const TOKEN_URL = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`;
const SCOPES = ["pages_show_list", "pages_read_engagement", "pages_read_user_content"];

export function isFacebookConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET && process.env.APP_URL);
}

function getRedirectUri(): string {
  return `${process.env.APP_URL}/api/facebook/callback`;
}

export function buildFacebookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID ?? "",
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(","),
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  expires_in?: number;
}

/** Wisselt de authorization-code om voor een kortlevend user-token en direct daarna voor een
 * long-lived user-token (~60 dagen), zoals voorgeschreven door Facebook Login. Page-tokens die
 * hierna via /me/accounts worden opgehaald erven deze lange geldigheid. */
export async function exchangeCodeForUserToken(code: string): Promise<{ accessToken: string; expiresAt: Date }> {
  const shortLivedUrl = new URL(TOKEN_URL);
  shortLivedUrl.searchParams.set("client_id", process.env.FACEBOOK_APP_ID ?? "");
  shortLivedUrl.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET ?? "");
  shortLivedUrl.searchParams.set("redirect_uri", getRedirectUri());
  shortLivedUrl.searchParams.set("code", code);

  const shortLivedResponse = await fetch(shortLivedUrl.toString());
  if (!shortLivedResponse.ok) {
    throw new Error(`Facebook-tokenuitwisseling mislukt: ${shortLivedResponse.status} ${await shortLivedResponse.text()}`);
  }
  const shortLived = (await shortLivedResponse.json()) as TokenResponse;

  const longLivedUrl = new URL(TOKEN_URL);
  longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
  longLivedUrl.searchParams.set("client_id", process.env.FACEBOOK_APP_ID ?? "");
  longLivedUrl.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET ?? "");
  longLivedUrl.searchParams.set("fb_exchange_token", shortLived.access_token);

  const longLivedResponse = await fetch(longLivedUrl.toString());
  if (!longLivedResponse.ok) {
    throw new Error(`Facebook long-lived tokenuitwisseling mislukt: ${longLivedResponse.status} ${await longLivedResponse.text()}`);
  }
  const longLived = (await longLivedResponse.json()) as TokenResponse;

  return {
    accessToken: longLived.access_token,
    expiresAt: new Date(Date.now() + (longLived.expires_in ?? 60 * 24 * 60 * 60) * 1000),
  };
}

export interface RefreshedFacebookTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}

/** Page-tokens die zijn afgeleid van een long-lived user-token verlopen in de praktijk niet
 * vanzelf (Meta's documentatie noemt ze "vrijwel permanent" zolang de gebruiker de app-toegang
 * niet intrekt). Er is geen apart "ververs dit page-token"-endpoint zoals bij Instagram; we
 * controleren daarom alleen of het token nog geldig is en verlengen de lokale expiry-datum. */
export async function refreshAccessToken(currentPageToken: string): Promise<RefreshedFacebookTokens> {
  const url = new URL("https://graph.facebook.com/v21.0/me");
  url.searchParams.set("fields", "id");
  url.searchParams.set("access_token", currentPageToken);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `Facebook page-token is niet meer geldig (${response.status}); koppel dit kanaal opnieuw.`
    );
  }

  return {
    accessToken: currentPageToken,
    refreshToken: currentPageToken,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  };
}
