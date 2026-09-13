import "server-only";
import { classifyPendingReviews } from "@/lib/ai/classify";
import { checkAlertThresholds } from "@/lib/ai/alerts";
import { isAiConfigured } from "@/lib/ai/client";
import { notifyNewAlerts } from "@/lib/notifications";

/** Net als bij een reguliere kanaal-sync: classificeert direct en controleert
 * alert-drempels, zodat een publiek ingezonden review (campagne, widget) zonder
 * speciale afhandeling door dezelfde AI-pijplijn stroomt als gesynchroniseerde reviews. */
export async function runPostSubmissionPipeline(companyId: string): Promise<void> {
  if (!isAiConfigured()) return;

  try {
    await classifyPendingReviews(companyId);
    const newAlerts = await checkAlertThresholds(companyId);
    if (newAlerts.length > 0) {
      await notifyNewAlerts(companyId, newAlerts);
    }
  } catch (err) {
    console.error(`Classificatie/alert-check na publieke inzending mislukt voor bedrijf ${companyId}:`, err);
  }
}
