import "server-only";
import { prisma } from "@/lib/prisma";
import { syncGoogleConnection, type SyncResult } from "@/lib/google/sync";
import { classifyPendingReviews, type ClassifyPendingResult } from "@/lib/ai/classify";
import { checkAlertThresholds } from "@/lib/ai/alerts";
import { isAiConfigured } from "@/lib/ai/client";
import type { Alert } from "@/generated/prisma/client";

export interface ChannelSyncPipelineResult {
  sync: SyncResult;
  classification: ClassifyPendingResult | null;
  newAlerts: Alert[];
}

/** Haalt reviews op via Google, classificeert nieuwe/onbewerkte reviews met AI
 * (indien geconfigureerd) en controleert daarna of er alerts aangemaakt moeten worden. */
export async function runGoogleSyncPipeline(connectionId: string): Promise<ChannelSyncPipelineResult> {
  const sync = await syncGoogleConnection(connectionId);

  let classification: ClassifyPendingResult | null = null;
  let newAlerts: Alert[] = [];

  if (isAiConfigured()) {
    classification = await classifyPendingReviews(sync.companyId);
    newAlerts = await checkAlertThresholds(sync.companyId);
  }

  return { sync, classification, newAlerts };
}

/** Draait de volledige pipeline voor alle actieve Google-koppelingen, bv. vanuit een cron-job. */
export async function runAllGoogleSyncPipelines(): Promise<ChannelSyncPipelineResult[]> {
  const connections = await prisma.platformConnection.findMany({
    where: { platform: "google", status: "active" },
    select: { id: true },
  });

  const results: ChannelSyncPipelineResult[] = [];
  for (const connection of connections) {
    try {
      results.push(await runGoogleSyncPipeline(connection.id));
    } catch (err) {
      console.error(`Sync-pipeline mislukt voor koppeling ${connection.id}:`, err);
    }
  }
  return results;
}
