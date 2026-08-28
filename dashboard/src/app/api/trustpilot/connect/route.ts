import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { buildTrustpilotAuthUrl, isTrustpilotConfigured } from "@/lib/trustpilot/oauth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isTrustpilotConfigured()) {
    return NextResponse.redirect(new URL("/kanalen?error=trustpilot_not_configured", request.url));
  }

  const businessUnitId = request.nextUrl.searchParams.get("businessUnitId")?.trim();
  if (!businessUnitId) {
    return NextResponse.redirect(new URL("/kanalen?error=missing_business_unit", request.url));
  }

  const nonce = randomBytes(16).toString("hex");
  const state = `${nonce}.${Buffer.from(businessUnitId).toString("base64url")}`;

  const response = NextResponse.redirect(buildTrustpilotAuthUrl(state));
  response.cookies.set("trustpilot_oauth_state", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
