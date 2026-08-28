import { NextResponse, type NextRequest } from "next/server";
import { runAllSyncPipelines } from "@/lib/pipeline";

// Bedoeld om periodiek aangeroepen te worden door een externe scheduler
// (bv. Vercel Cron via vercel.json), met header: Authorization: Bearer <CRON_SECRET>
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runAllSyncPipelines();
  return NextResponse.json({
    synced: results.length,
    results,
  });
}
