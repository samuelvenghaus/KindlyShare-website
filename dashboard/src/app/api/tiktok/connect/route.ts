import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { buildTikTokAuthUrl, isTikTokConfigured } from "@/lib/tiktok/oauth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isTikTokConfigured()) {
    return NextResponse.redirect(new URL("/kanalen?error=tiktok_not_configured", request.url));
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(buildTikTokAuthUrl(state));
  response.cookies.set("tiktok_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
