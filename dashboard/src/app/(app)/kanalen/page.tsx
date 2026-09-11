import { CheckCircle2, TriangleAlert } from "lucide-react";
import { PageHeader, DateRangeButton, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card, CardHeader } from "@/components/ui/Card";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { ConnectionsList } from "@/components/kanalen/ConnectionsList";
import { AppleConnectForm } from "@/components/kanalen/AppleConnectForm";
import { SetupSteps, SetupNote } from "@/components/kanalen/SetupSteps";
import { PLATFORM_LABELS } from "@/lib/dummy-data";
import type { Platform } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isGoogleOAuthConfigured } from "@/lib/google/oauth";
import { isTrustpilotConfigured } from "@/lib/trustpilot/oauth";
import { isInstagramConfigured } from "@/lib/instagram/oauth";
import { isFacebookConfigured } from "@/lib/facebook/oauth";
import { isTikTokConfigured } from "@/lib/tiktok/oauth";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured:
    "Google-koppeling is nog niet geconfigureerd. Vraag de beheerder om GOOGLE_CLIENT_ID en GOOGLE_CLIENT_SECRET in te stellen.",
  trustpilot_not_configured:
    "Trustpilot-koppeling is nog niet geconfigureerd. Vraag de beheerder om TRUSTPILOT_API_KEY en TRUSTPILOT_API_SECRET in te stellen.",
  instagram_not_configured:
    "Instagram-koppeling is nog niet geconfigureerd. Vraag de beheerder om INSTAGRAM_APP_ID en INSTAGRAM_APP_SECRET in te stellen.",
  facebook_not_configured:
    "Facebook-koppeling is nog niet geconfigureerd. Vraag de beheerder om FACEBOOK_APP_ID en FACEBOOK_APP_SECRET in te stellen.",
  tiktok_not_configured:
    "TikTok-koppeling is nog niet geconfigureerd. Vraag de beheerder om TIKTOK_APP_ID en TIKTOK_APP_SECRET in te stellen.",
  missing_business_unit: "Vul je Trustpilot business unit ID in voordat je verbindt.",
  invalid_state: "De koppelpoging is verlopen of ongeldig. Probeer het opnieuw.",
  no_accounts: "Er is geen Google Bedrijfsprofiel gevonden voor dit Google-account.",
  no_pages: "Er is geen Facebook-pagina gevonden waar je beheerder van bent.",
  no_advertisers: "Er is geen TikTok-advertiseraccount gevonden waar je toegang toe hebt.",
  connection_failed: "Het koppelen is mislukt. Probeer het opnieuw.",
  access_denied: "Toestemming geweigerd.",
};

const COMING_SOON_PLATFORMS: Platform[] = ["overig"];

export default async function KanalenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  const [
    googleConnections,
    trustpilotConnections,
    appleConnections,
    instagramConnections,
    facebookConnections,
    tiktokConnections,
  ] = session
    ? await Promise.all([
        prisma.platformConnection.findMany({
          where: { companyId: session.companyId, platform: "google" },
          orderBy: { lastSyncedAt: "desc" },
        }),
        prisma.platformConnection.findMany({
          where: { companyId: session.companyId, platform: "trustpilot" },
          orderBy: { lastSyncedAt: "desc" },
        }),
        prisma.platformConnection.findMany({
          where: { companyId: session.companyId, platform: "app_store" },
          orderBy: { lastSyncedAt: "desc" },
        }),
        prisma.platformConnection.findMany({
          where: { companyId: session.companyId, platform: "instagram" },
          orderBy: { lastSyncedAt: "desc" },
        }),
        prisma.platformConnection.findMany({
          where: { companyId: session.companyId, platform: "facebook" },
          orderBy: { lastSyncedAt: "desc" },
        }),
        prisma.platformConnection.findMany({
          where: { companyId: session.companyId, platform: "tiktok" },
          orderBy: { lastSyncedAt: "desc" },
        }),
      ])
    : [[], [], [], [], [], []];

  const connectedCount = typeof params.connected === "string" ? params.connected : null;
  const errorCode = typeof params.error === "string" ? params.error : null;

  return (
    <>
      <PageHeader
        title="Kanalen"
        subtitle="Koppel je reviewplatforms om feedback automatisch te verzamelen."
        actions={
          <>
            <DateRangeButton />
            <UserMenu />
          </>
        }
      />

      {connectedCount && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-positive/30 bg-positive-bg px-4 py-3 text-sm text-positive">
          <CheckCircle2 size={16} />
          {connectedCount} locatie{connectedCount === "1" ? "" : "s"} succesvol gekoppeld.
        </div>
      )}
      {errorCode && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-negative/30 bg-negative-bg px-4 py-3 text-sm text-negative">
          <TriangleAlert size={16} />
          {ERROR_MESSAGES[errorCode] ?? "Er is iets misgegaan bij het koppelen."}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Google */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <PlatformIcon platform="google" size={22} />
                {PLATFORM_LABELS.google}
              </span>
            }
          />
          {googleConnections.length === 0 ? (
            <div>
              <p className="text-sm text-muted">
                Verbind je Google Bedrijfsprofiel om reviews automatisch op te halen en te centraliseren.
              </p>
              {isGoogleOAuthConfigured() ? (
                <>
                  <SetupSteps
                    steps={[
                      "Zorg dat je een Google Bedrijfsprofiel hebt op business.google.com en dat je hier beheerder van bent.",
                      "Klik op “Verbinden met Google” hieronder.",
                      "Log in met het Google-account dat toegang heeft tot je Bedrijfsprofiel en geef KindlyShare toestemming.",
                      "Al je locaties worden automatisch gevonden en gekoppeld.",
                    ]}
                  />
                  <a
                    href="/api/google/connect"
                    className="mt-4 inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-95"
                  >
                    Verbinden met Google
                  </a>
                </>
              ) : (
                <p className="mt-4 rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-xs text-muted">
                  Nog niet geconfigureerd. Stel <code>GOOGLE_CLIENT_ID</code> en{" "}
                  <code>GOOGLE_CLIENT_SECRET</code> in om deze koppeling te activeren.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <ConnectionsList connections={googleConnections} />
              {isGoogleOAuthConfigured() && (
                <a href="/api/google/connect" className="text-sm font-medium text-brand hover:underline">
                  + Nog een locatie koppelen
                </a>
              )}
            </div>
          )}
        </Card>

        {/* Trustpilot */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <PlatformIcon platform="trustpilot" size={22} />
                {PLATFORM_LABELS.trustpilot}
              </span>
            }
          />
          {trustpilotConnections.length === 0 ? (
            <div>
              <p className="text-sm text-muted">
                Verbind je Trustpilot-bedrijfsprofiel om reviews automatisch op te halen.
              </p>
              {isTrustpilotConfigured() ? (
                <>
                  <SetupSteps
                    steps={[
                      "Zorg dat je een Trustpilot Business-account hebt.",
                      "Zoek je Business Unit ID op: log in op je Trustpilot Business-dashboard, dit ID staat in de URL van je bedrijfsprofiel of onder Integraties/API.",
                      "Vul de Business Unit ID hieronder in en klik op “Verbinden met Trustpilot”.",
                      "Log in bij Trustpilot en geef toestemming - je reviews worden voortaan automatisch opgehaald.",
                    ]}
                  />
                  <form action="/api/trustpilot/connect" method="GET" className="mt-4 space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Trustpilot business unit ID
                      </span>
                      <input
                        name="businessUnitId"
                        placeholder="5a7ab545..."
                        required
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
                      />
                    </label>
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-95"
                    >
                      Verbinden met Trustpilot
                    </button>
                  </form>
                </>
              ) : (
                <p className="mt-4 rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-xs text-muted">
                  Nog niet geconfigureerd. Stel <code>TRUSTPILOT_API_KEY</code> en{" "}
                  <code>TRUSTPILOT_API_SECRET</code> in om deze koppeling te activeren.
                </p>
              )}
            </div>
          ) : (
            <ConnectionsList connections={trustpilotConnections} />
          )}
        </Card>

        {/* App Store Connect */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <PlatformIcon platform="app_store" size={22} />
                App Store
              </span>
            }
          />
          {appleConnections.length === 0 ? (
            <div>
              <p className="text-sm text-muted">
                Verbind je App Store Connect-account om app-reviews automatisch op te halen.
              </p>
              <SetupSteps
                steps={[
                  "Log in op appstoreconnect.apple.com met een Apple Developer-account (rol Accountbeheerder of Admin).",
                  "Ga naar Gebruikers en toegang > Integraties > App Store Connect API en maak een nieuwe sleutel aan.",
                  "Noteer de Key ID en Issuer ID, en download het .p8-bestand - dit kan maar één keer!",
                  "Vul hieronder je App-ID, Issuer ID en Key ID in, en plak de inhoud van het .p8-bestand.",
                ]}
              />
              <AppleConnectForm />
            </div>
          ) : (
            <ConnectionsList connections={appleConnections} />
          )}
        </Card>

        {/* Instagram */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <PlatformIcon platform="instagram" size={22} />
                {PLATFORM_LABELS.instagram}
              </span>
            }
          />
          {instagramConnections.length === 0 ? (
            <div>
              <p className="text-sm text-muted">
                Verbind je Instagram-bedrijfsaccount om comments onder je posts automatisch te
                verzamelen. Onze AI filtert spam en losse reacties eruit, zodat alleen
                daadwerkelijke feedback meetelt.
              </p>
              {isInstagramConfigured() ? (
                <>
                  <SetupSteps
                    steps={[
                      "Zorg dat je Instagram-account een Professional-account is (Zakelijk of Creator) - instelbaar via de Instagram-app onder Instellingen > Account.",
                      "Klik op “Verbinden met Instagram” hieronder.",
                      "Log in en geef toestemming voor toegang tot je posts en comments.",
                      "Je account wordt automatisch gekoppeld - comments worden voortaan opgehaald.",
                    ]}
                  />
                  <a
                    href="/api/instagram/connect"
                    className="mt-4 inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-95"
                  >
                    Verbinden met Instagram
                  </a>
                </>
              ) : (
                <p className="mt-4 rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-xs text-muted">
                  Nog niet geconfigureerd. Stel <code>INSTAGRAM_APP_ID</code> en{" "}
                  <code>INSTAGRAM_APP_SECRET</code> in om deze koppeling te activeren.
                </p>
              )}
            </div>
          ) : (
            <ConnectionsList connections={instagramConnections} />
          )}
        </Card>

        {/* Facebook */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <PlatformIcon platform="facebook" size={22} />
                {PLATFORM_LABELS.facebook}
              </span>
            }
          />
          {facebookConnections.length === 0 ? (
            <div>
              <p className="text-sm text-muted">
                Verbind je Facebook-pagina om aanbevelingen (recommends/doesn&apos;t recommend) en
                reviews automatisch op te halen.
              </p>
              {isFacebookConfigured() ? (
                <>
                  <SetupSteps
                    steps={[
                      "Zorg dat je beheerder (Admin) bent van een Facebook-pagina.",
                      "Klik op “Verbinden met Facebook” hieronder.",
                      "Log in bij Facebook, selecteer de pagina('s) die je wilt koppelen en geef toestemming.",
                      "Je pagina('s) worden automatisch gekoppeld - aanbevelingen en reviews worden voortaan opgehaald.",
                    ]}
                  />
                  <a
                    href="/api/facebook/connect"
                    className="mt-4 inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-95"
                  >
                    Verbinden met Facebook
                  </a>
                </>
              ) : (
                <p className="mt-4 rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-xs text-muted">
                  Nog niet geconfigureerd. Stel <code>FACEBOOK_APP_ID</code> en{" "}
                  <code>FACEBOOK_APP_SECRET</code> in om deze koppeling te activeren.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <ConnectionsList connections={facebookConnections} />
              {isFacebookConfigured() && (
                <a href="/api/facebook/connect" className="text-sm font-medium text-brand hover:underline">
                  + Nog een pagina koppelen
                </a>
              )}
            </div>
          )}
        </Card>

        {/* TikTok */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <PlatformIcon platform="tiktok" size={22} />
                {PLATFORM_LABELS.tiktok}
              </span>
            }
          />
          {tiktokConnections.length === 0 ? (
            <div>
              <p className="text-sm text-muted">
                Verbind je TikTok Ads/Business-account om comments onder je video&apos;s
                automatisch te verzamelen. Onze AI filtert spam en losse reacties eruit.
              </p>
              {isTikTokConfigured() ? (
                <>
                  <SetupNote>
                    Let op: een gewoon (gratis) TikTok Zakelijk-account is hiervoor niet genoeg. Je
                    hebt een TikTok <strong>Ads-account</strong> nodig - dit kan gratis via
                    ads.tiktok.com, ook zonder daadwerkelijk te adverteren.
                  </SetupNote>
                  <SetupSteps
                    steps={[
                      "Maak een TikTok Ads-account aan via ads.tiktok.com (indien je die nog niet hebt).",
                      "Klik op “Verbinden met TikTok” hieronder.",
                      "Log in met je TikTok Ads-account en geef toestemming.",
                      "Je advertiser-account wordt gekoppeld - comments op je video's worden voortaan opgehaald.",
                    ]}
                  />
                  <a
                    href="/api/tiktok/connect"
                    className="mt-4 inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-95"
                  >
                    Verbinden met TikTok
                  </a>
                </>
              ) : (
                <p className="mt-4 rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-xs text-muted">
                  Nog niet geconfigureerd. Stel <code>TIKTOK_APP_ID</code> en{" "}
                  <code>TIKTOK_APP_SECRET</code> in om deze koppeling te activeren.
                </p>
              )}
            </div>
          ) : (
            <ConnectionsList connections={tiktokConnections} />
          )}
        </Card>

        {COMING_SOON_PLATFORMS.map((platform) => (
          <Card key={platform}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <PlatformIcon platform={platform} size={22} />
                  {PLATFORM_LABELS[platform]}
                </span>
              }
            />
            <p className="text-sm text-muted">Deze koppeling komt in een latere fase beschikbaar.</p>
          </Card>
        ))}
      </div>
    </>
  );
}
