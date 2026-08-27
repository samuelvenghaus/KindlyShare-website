import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { exchangeCodeForTokens } from "@/lib/google/oauth";
import { listAccounts, listLocations } from "@/lib/google/business-profile";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`/kanalen?error=${encodeURIComponent(error)}`, request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("google_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/kanalen?error=invalid_state", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const accounts = await listAccounts(tokens.accessToken);

    if (accounts.length === 0) {
      return NextResponse.redirect(new URL("/kanalen?error=no_accounts", request.url));
    }

    let connectedCount = 0;
    for (const account of accounts) {
      const locations = await listLocations(tokens.accessToken, account.name);
      for (const location of locations) {
        const externalAccountId = `${account.name}/${location.name}`;
        await prisma.platformConnection.upsert({
          where: {
            companyId_platform_externalAccountId: {
              companyId: session.companyId,
              platform: "google",
              externalAccountId,
            },
          },
          create: {
            companyId: session.companyId,
            platform: "google",
            externalAccountId,
            accessToken: encryptSecret(tokens.accessToken),
            refreshToken: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
            tokenExpiresAt: tokens.expiresAt,
            status: "active",
          },
          update: {
            accessToken: encryptSecret(tokens.accessToken),
            ...(tokens.refreshToken ? { refreshToken: encryptSecret(tokens.refreshToken) } : {}),
            tokenExpiresAt: tokens.expiresAt,
            status: "active",
          },
        });
        connectedCount++;
      }
    }

    const response = NextResponse.redirect(new URL(`/kanalen?connected=${connectedCount}`, request.url));
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (err) {
    console.error("Google OAuth callback mislukt:", err);
    return NextResponse.redirect(new URL("/kanalen?error=connection_failed", request.url));
  }
}
