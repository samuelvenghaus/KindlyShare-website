import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { buildInstagramAuthUrl, isInstagramConfigured } from "@/lib/instagram/oauth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isInstagramConfigured()) {
    return NextResponse.redirect(new URL("/kanalen?error=instagram_not_configured", request.url));
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(buildInstagramAuthUrl(state));
  response.cookies.set("instagram_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
