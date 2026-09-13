import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/signup"];
// Publieke routes zonder login: het token-gebaseerde feedbackformulier/afmeldlink die
// klanten via een campagne-mail ontvangen, de bijbehorende tracking-pixel, de
// cron-endpoints die hun eigen Bearer-token-check hebben (geen sessie-cookie beschikbaar
// bij een aanroep vanuit een externe scheduler), en de embed-widget die bedrijven op hun
// eigen website plaatsen (wordt in een <iframe> geladen, dus ook zonder sessie-cookie).
const PUBLIC_PREFIXES = ["/feedback-formulier/", "/afmelden/", "/api/campagnes/track/", "/api/cron/", "/beoordeel/"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPath = PUBLIC_PATHS.some((path) => pathname === path);
  const isPublicPrefix = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Publieke prefixes (feedbackformulier, afmelden, tracking-pixel, cron) werken altijd
  // hetzelfde, ongeacht of er toevallig een sessie-cookie meekomt - een ingelogde gebruiker
  // die zo'n link opent moet gewoon het formulier zien, niet naar /dashboard geredirect worden.
  if (isPublicPrefix) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session && !isAuthPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon-32.png|favicon-48.png|apple-touch-icon.png|icon-192.png|icon-512.png|icon-512-maskable.png|manifest.webmanifest|logo.png).*)",
  ],
};
