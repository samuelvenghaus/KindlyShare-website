import "server-only";
import { prisma } from "@/lib/prisma";
import { syncGoogleConnection, type SyncResult } from "@/lib/google/sync";
import { syncTrustpilotConnection } from "@/lib/trustpilot/sync";
import { syncAppleConnection } from "@/lib/apple/sync";
import { syncInstagramConnection } from "@/lib/instagram/sync";
import { syncFacebookConnection } from "@/lib/facebook/sync";
import { syncTikTokConnection } from "@/lib/tiktok/sync";
import { classifyPendingReviews, type ClassifyPendingResult } from "@/lib/ai/classify";
import { checkAlertThresholds, type AlertWithTopic } from "@/lib/ai/alerts";
import { isAiConfigured } from "@/lib/ai/client";
import { notifyNewAlerts } from "@/lib/notifications";
import type { Platform } from "@/lib/types";

export interface ChannelSyncPipelineResult {
  sync: SyncResult;
  classification: ClassifyPendingResult | null;
  newAlerts: AlertWithTopic[];
}

// Adapter-patroon: elk platform levert een syncXConnection(connectionId) met
// hetzelfde SyncResult-contract; de rest van de pipeline (classificatie,
// alert-check) is platform-agnostisch en hoeft niet per platform herhaald te worden.
const SYNC_ADAPTERS: Record<string, (connectionId: string) => Promise<SyncResult>> = {
  google: syncGoogleConnection,
  trustpilot: syncTrustpilotConnection,
  app_store: syncAppleConnection,
  instagram: syncInstagramConnection,
  facebook: syncFacebookConnection,
  tiktok: syncTikTokConnection,
};

const SYNCABLE_PLATFORMS = Object.keys(SYNC_ADAPTERS) as Platform[];

/** Haalt reviews op via het juiste platform-adapter, classificeert nieuwe/onbewerkte
 * reviews met AI (indien geconfigureerd) en controleert daarna of er alerts
 * aangemaakt moeten worden. */
export async function runSyncPipeline(connectionId: string): Promise<ChannelSyncPipelineResult> {
  const connection = await prisma.platformConnection.findUniqueOrThrow({ where: { id: connectionId } });
  const syncFn = SYNC_ADAPTERS[connection.platform];
  if (!syncFn) {
    throw new Error(`Geen sync-adapter beschikbaar voor platform "${connection.platform}".`);
  }

  const sync = await syncFn(connectionId);

  let classification: ClassifyPendingResult | null = null;
  let newAlerts: AlertWithTopic[] = [];

  if (isAiConfigured()) {
    classification = await classifyPendingReviews(sync.companyId);
    newAlerts = await checkAlertThresholds(sync.companyId);
    if (newAlerts.length > 0) {
      try {
        await notifyNewAlerts(sync.companyId, newAlerts);
      } catch (err) {
        console.error(`Notificaties versturen mislukt voor bedrijf ${sync.companyId}:`, err);
      }
    }
  }

  return { sync, classification, newAlerts };
}

/** Draait de volledige pipeline voor alle actieve koppelingen van alle
 * gekoppelde platforms, bv. vanuit een cron-job. */
export async function runAllSyncPipelines(): Promise<ChannelSyncPipelineResult[]> {
  const connections = await prisma.platformConnection.findMany({
    where: { platform: { in: SYNCABLE_PLATFORMS }, status: "active" },
    select: { id: true },
  });

  const results: ChannelSyncPipelineResult[] = [];
  for (const connection of connections) {
    try {
      results.push(await runSyncPipeline(connection.id));
    } catch (err) {
      console.error(`Sync-pipeline mislukt voor koppeling ${connection.id}:`, err);
    }
  }
  return results;
}
