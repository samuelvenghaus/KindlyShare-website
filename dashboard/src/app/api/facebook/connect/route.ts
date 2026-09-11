import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { buildFacebookAuthUrl, isFacebookConfigured } from "@/lib/facebook/oauth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isFacebookConfigured()) {
    return NextResponse.redirect(new URL("/kanalen?error=facebook_not_configured", request.url));
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(buildFacebookAuthUrl(state));
  response.cookies.set("facebook_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
