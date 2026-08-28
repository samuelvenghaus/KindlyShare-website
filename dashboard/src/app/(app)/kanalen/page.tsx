import { CheckCircle2, TriangleAlert } from "lucide-react";
import { PageHeader, DateRangeButton, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card, CardHeader } from "@/components/ui/Card";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { ConnectionsList } from "@/components/kanalen/ConnectionsList";
import { AppleConnectForm } from "@/components/kanalen/AppleConnectForm";
import { PLATFORM_LABELS } from "@/lib/dummy-data";
import type { Platform } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isGoogleOAuthConfigured } from "@/lib/google/oauth";
import { isTrustpilotConfigured } from "@/lib/trustpilot/oauth";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured:
    "Google-koppeling is nog niet geconfigureerd. Vraag de beheerder om GOOGLE_CLIENT_ID en GOOGLE_CLIENT_SECRET in te stellen.",
  trustpilot_not_configured:
    "Trustpilot-koppeling is nog niet geconfigureerd. Vraag de beheerder om TRUSTPILOT_API_KEY en TRUSTPILOT_API_SECRET in te stellen.",
  missing_business_unit: "Vul je Trustpilot business unit ID in voordat je verbindt.",
  invalid_state: "De koppelpoging is verlopen of ongeldig. Probeer het opnieuw.",
  no_accounts: "Er is geen Google Bedrijfsprofiel gevonden voor dit Google-account.",
  connection_failed: "Het koppelen is mislukt. Probeer het opnieuw.",
  access_denied: "Toestemming geweigerd.",
};

const COMING_SOON_PLATFORMS: Platform[] = ["facebook", "tiktok", "instagram", "overig"];

export default async function KanalenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  const [googleConnections, trustpilotConnections, appleConnections] = session
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
      ])
    : [[], [], []];

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
                <a
                  href="/api/google/connect"
                  className="mt-4 inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-95"
                >
                  Verbinden met Google
                </a>
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
              <AppleConnectForm />
            </div>
          ) : (
            <ConnectionsList connections={appleConnections} />
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
