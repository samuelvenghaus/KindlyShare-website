import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { ReportPeriod } from "@/lib/data/reports";

const PERIOD_DAYS: Record<ReportPeriod, number> = { week: 7, month: 30, quarter: 90 };

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const periodParam = request.nextUrl.searchParams.get("period");
  const period: ReportPeriod = periodParam === "month" || periodParam === "quarter" ? periodParam : "week";
  const periodStart = new Date(Date.now() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000);

  const reviews = await prisma.review.findMany({
    where: { companyId: session.companyId, postedAt: { gte: periodStart } },
    orderBy: { postedAt: "desc" },
    include: { topics: { include: { topic: true } } },
  });

  const header = ["Platform", "Auteur", "Score", "Sentiment", "Type", "Onderwerpen", "Tekst", "Geplaatst op"];
  const rows = reviews.map((review) =>
    [
      review.platform,
      review.author ?? "",
      review.rating?.toString() ?? "",
      review.sentiment ?? "",
      review.feedbackType ?? "",
      review.topics.map((t) => t.topic.label).join("; "),
      review.text ?? "",
      review.postedAt ? review.postedAt.toISOString() : "",
    ]
      .map(csvEscape)
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kindlyshare-rapport-${period}.csv"`,
    },
  });
}
