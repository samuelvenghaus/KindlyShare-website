import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { exchangeCodeForUserToken } from "@/lib/facebook/oauth";
import { listPages } from "@/lib/facebook/api";

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
  const expectedState = request.cookies.get("facebook_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/kanalen?error=invalid_state", request.url));
  }

  try {
    const userToken = await exchangeCodeForUserToken(code);
    const pages = await listPages(userToken.accessToken);

    if (pages.length === 0) {
      return NextResponse.redirect(new URL("/kanalen?error=no_pages", request.url));
    }

    let connectedCount = 0;
    for (const page of pages) {
      await prisma.platformConnection.upsert({
        where: {
          companyId_platform_externalAccountId: {
            companyId: session.companyId,
            platform: "facebook",
            externalAccountId: page.id,
          },
        },
        create: {
          companyId: session.companyId,
          platform: "facebook",
          externalAccountId: page.id,
          accessToken: encryptSecret(page.accessToken),
          refreshToken: encryptSecret(page.accessToken),
          tokenExpiresAt: userToken.expiresAt,
          status: "active",
        },
        update: {
          accessToken: encryptSecret(page.accessToken),
          refreshToken: encryptSecret(page.accessToken),
          tokenExpiresAt: userToken.expiresAt,
          status: "active",
        },
      });
      connectedCount++;
    }

    const response = NextResponse.redirect(new URL(`/kanalen?connected=${connectedCount}`, request.url));
    response.cookies.delete("facebook_oauth_state");
    return response;
  } catch (err) {
    console.error("Facebook OAuth callback mislukt:", err);
    return NextResponse.redirect(new URL("/kanalen?error=connection_failed", request.url));
  }
}
