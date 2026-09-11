import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { exchangeCodeForTokens } from "@/lib/tiktok/oauth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`/kanalen?error=${encodeURIComponent(error)}`, request.url));
  }

  // TikTok Business API gebruikt "auth_code" als queryparameter-naam i.p.v. het gangbare "code"
  // (niet live geverifieerd) - we lezen voor de zekerheid ook "code" als fallback.
  const code = request.nextUrl.searchParams.get("auth_code") ?? request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("tiktok_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/kanalen?error=invalid_state", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    if (tokens.advertiserIds.length === 0) {
      return NextResponse.redirect(new URL("/kanalen?error=no_advertisers", request.url));
    }

    let connectedCount = 0;
    for (const advertiserId of tokens.advertiserIds) {
      await prisma.platformConnection.upsert({
        where: {
          companyId_platform_externalAccountId: {
            companyId: session.companyId,
            platform: "tiktok",
            externalAccountId: advertiserId,
          },
        },
        create: {
          companyId: session.companyId,
          platform: "tiktok",
          externalAccountId: advertiserId,
          accessToken: encryptSecret(tokens.accessToken),
          refreshToken: encryptSecret(tokens.refreshToken),
          tokenExpiresAt: tokens.expiresAt,
          status: "active",
        },
        update: {
          accessToken: encryptSecret(tokens.accessToken),
          refreshToken: encryptSecret(tokens.refreshToken),
          tokenExpiresAt: tokens.expiresAt,
          status: "active",
        },
      });
      connectedCount++;
    }

    const response = NextResponse.redirect(new URL(`/kanalen?connected=${connectedCount}`, request.url));
    response.cookies.delete("tiktok_oauth_state");
    return response;
  } catch (err) {
    console.error("TikTok OAuth callback mislukt:", err);
    return NextResponse.redirect(new URL("/kanalen?error=connection_failed", request.url));
  }
}
