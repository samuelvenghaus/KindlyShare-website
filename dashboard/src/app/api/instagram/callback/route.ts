import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { exchangeCodeForTokens } from "@/lib/instagram/oauth";

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
  const expectedState = request.cookies.get("instagram_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/kanalen?error=invalid_state", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    await prisma.platformConnection.upsert({
      where: {
        companyId_platform_externalAccountId: {
          companyId: session.companyId,
          platform: "instagram",
          externalAccountId: tokens.igUserId,
        },
      },
      create: {
        companyId: session.companyId,
        platform: "instagram",
        externalAccountId: tokens.igUserId,
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

    const response = NextResponse.redirect(new URL("/kanalen?connected=1", request.url));
    response.cookies.delete("instagram_oauth_state");
    return response;
  } catch (err) {
    console.error("Instagram OAuth callback mislukt:", err);
    return NextResponse.redirect(new URL("/kanalen?error=connection_failed", request.url));
  }
}
