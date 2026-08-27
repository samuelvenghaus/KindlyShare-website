import { CheckCircle2, TriangleAlert, Circle } from "lucide-react";
import { PageHeader, DateRangeButton, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card, CardHeader } from "@/components/ui/Card";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { ChannelSyncButton } from "@/components/kanalen/ChannelSyncButton";
import { DisconnectButton } from "@/components/kanalen/DisconnectButton";
import { PLATFORM_LABELS, formatTimeAgo, minutesSince } from "@/lib/dummy-data";
import type { Platform } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isGoogleOAuthConfigured } from "@/lib/google/oauth";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Google-koppeling is nog niet geconfigureerd. Vraag de beheerder om GOOGLE_CLIENT_ID en GOOGLE_CLIENT_SECRET in te stellen.",
  invalid_state: "De koppelpoging is verlopen of ongeldig. Probeer het opnieuw.",
  no_accounts: "Er is geen Google Bedrijfsprofiel gevonden voor dit Google-account.",
  connection_failed: "Het koppelen is mislukt. Probeer het opnieuw.",
  access_denied: "Toestemming geweigerd in Google.",
};

const COMING_SOON_PLATFORMS: Platform[] = ["trustpilot", "facebook", "tiktok", "instagram", "overig"];

export default async function KanalenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const connections = session
    ? await prisma.platformConnection.findMany({
        where: { companyId: session.companyId, platform: "google" },
        orderBy: { lastSyncedAt: "desc" },
      })
    : [];

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
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <PlatformIcon platform="google" size={22} />
                {PLATFORM_LABELS.google}
              </span>
            }
          />

          {connections.length === 0 ? (
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
              {connections.map((connection) => (
                <div key={connection.id} className="rounded-xl border border-border bg-surface-elevated p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Circle size={8} className="fill-positive text-positive" />
                        Actief
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {connection.externalAccountId}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {connection.lastSyncedAt
                          ? `Laatst gesynchroniseerd: ${formatTimeAgo(minutesSince(connection.lastSyncedAt))}`
                          : "Nog niet gesynchroniseerd"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ChannelSyncButton connectionId={connection.id} />
                    <DisconnectButton connectionId={connection.id} />
                  </div>
                </div>
              ))}
              {isGoogleOAuthConfigured() && (
                <a href="/api/google/connect" className="text-sm font-medium text-brand hover:underline">
                  + Nog een locatie koppelen
                </a>
              )}
            </div>
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
