import Link from "next/link";
import clsx from "clsx";
import { Download, FileText, Star } from "lucide-react";
import { PageHeader, UserMenu } from "@/components/layout/HeaderWidgets";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PriorityBadge } from "@/components/ui/Badge";
import { DonutChart } from "@/components/charts/DonutChart";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { PLATFORM_SHORT_LABELS, SENTIMENT_LABELS, formatTimeAgo, minutesSince } from "@/lib/dummy-data";
import { CHART_COLORS } from "@/lib/chart-colors";
import { getSession } from "@/lib/auth";
import { getReportData, REPORT_PERIOD_LABELS, type ReportPeriod } from "@/lib/data/reports";
import type { Sentiment } from "@/lib/types";

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  positive: CHART_COLORS.positive,
  neutral: CHART_COLORS.neutral,
  negative: CHART_COLORS.negative,
};

const FEEDBACK_TYPE_COLOR: Record<string, string> = {
  praise: CHART_COLORS.positive,
  interest: CHART_COLORS.interest,
  problem: CHART_COLORS.negative,
  solution: CHART_COLORS.solution,
};

const FEEDBACK_TYPE_NAME: Record<string, string> = {
  praise: "Praise",
  interest: "Interest",
  problem: "Problems",
  solution: "Solutions",
};

const PERIODS: ReportPeriod[] = ["week", "month", "quarter"];

export default async function RapportenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const periodParam = typeof params.period === "string" ? params.period : "week";
  const period: ReportPeriod = PERIODS.includes(periodParam as ReportPeriod) ? (periodParam as ReportPeriod) : "week";

  const session = await getSession();
  const data = session ? await getReportData(session.companyId, period) : null;

  return (
    <>
      <PageHeader
        title="Rapporten"
        subtitle="Periodiek overzicht van je feedback om te delen met je team."
        actions={
          <>
            <a
              href={`/api/reports/export?period=${period}`}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground hover:bg-surface-elevated"
            >
              <Download size={16} className="text-muted" />
              Exporteer CSV
            </a>
            <UserMenu />
          </>
        }
      />

      <div className="mb-6 inline-flex rounded-xl border border-border bg-surface p-1">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={`/rapporten?period=${p}`}
            className={clsx(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              p === period ? "bg-brand text-[#0a0a0a]" : "text-muted hover:text-foreground"
            )}
          >
            {REPORT_PERIOD_LABELS[p]}
          </Link>
        ))}
      </div>

      {!data || !data.hasReviews ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-interest-bg text-interest">
            <FileText size={22} />
          </div>
          <p className="text-base font-semibold text-foreground">Nog geen data voor deze periode</p>
          <p className="max-w-sm text-sm text-muted">
            Zodra er feedback binnenkomt, verschijnt hier een overzicht van {REPORT_PERIOD_LABELS[period].toLowerCase()}.
          </p>
        </Card>
      ) : (
        <>
          <p className="mb-4 text-xs text-muted">Periode: {data.dateRangeLabel}</p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={FileText}
              iconClassName="bg-interest-bg text-interest"
              label="Totaal feedback"
              value={data.totalReviews.value.toLocaleString("nl-NL")}
              changePercent={data.totalReviews.changePercent}
            />
            <Card>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-solution-bg text-solution">
                <Star size={20} />
              </div>
              <p className="text-sm text-muted">Gemiddelde score</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">
                  {data.averageRating !== null ? data.averageRating.toFixed(1) : "–"}
                </span>
                {data.averageRating !== null && <span className="text-sm text-muted">/ 5</span>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">over deze periode</p>
            </Card>
            <Card>
              <CardHeader title="Alerts" />
              <p className="text-2xl font-semibold tracking-tight">{data.alerts.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.alerts.filter((a) => !a.resolved).length} nog open
              </p>
            </Card>
            <Card>
              <CardHeader title="Kanalen" />
              <p className="text-2xl font-semibold tracking-tight">{data.channelBreakdown.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">actieve kanalen met feedback</p>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Sentiment-verdeling" />
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <DonutChart
                  centerValue={data.totalReviews.value.toLocaleString("nl-NL")}
                  centerLabel="Totaal"
                  data={data.sentimentBreakdown
                    .filter((s) => s.count > 0)
                    .map((s) => ({ name: SENTIMENT_LABELS[s.sentiment], value: s.count, color: SENTIMENT_COLOR[s.sentiment] }))}
                />
                <div className="w-full space-y-3">
                  {data.sentimentBreakdown.map((s) => (
                    <div key={s.sentiment} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SENTIMENT_COLOR[s.sentiment] }} />
                        {SENTIMENT_LABELS[s.sentiment]}
                      </span>
                      <span className="font-medium text-foreground">{s.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Feedbacktype-verdeling" />
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <DonutChart
                  centerValue={data.feedbackTypeBreakdown.reduce((s, i) => s + i.count, 0).toLocaleString("nl-NL")}
                  centerLabel="Totaal"
                  data={data.feedbackTypeBreakdown
                    .filter((i) => i.count > 0)
                    .map((i) => ({ name: FEEDBACK_TYPE_NAME[i.type], value: i.count, color: FEEDBACK_TYPE_COLOR[i.type] }))}
                />
                <div className="w-full space-y-3">
                  {data.feedbackTypeBreakdown.map((i) => (
                    <div key={i.type} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: FEEDBACK_TYPE_COLOR[i.type] }} />
                        {FEEDBACK_TYPE_NAME[i.type]}
                      </span>
                      <span className="font-medium text-foreground">{i.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Meest genoemde onderwerpen" />
              {data.topTopics.length === 0 ? (
                <p className="text-sm text-muted">Nog geen onderwerpen herkend in deze periode.</p>
              ) : (
                <div className="space-y-4">
                  {data.topTopics.map((topic) => {
                    const max = data.topTopics[0].count;
                    const pct = max === 0 ? 0 : Math.round((topic.count / max) * 100);
                    return (
                      <div key={topic.label}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="text-foreground">{topic.label}</span>
                          <span className="font-medium text-muted">{topic.count}</span>
                        </div>
                        <ProgressBar percentage={pct} color={CHART_COLORS.brand} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Verdeling per kanaal" />
              {data.channelBreakdown.length === 0 ? (
                <p className="text-sm text-muted">Nog geen kanalen met data.</p>
              ) : (
                <div className="space-y-3">
                  {data.channelBreakdown.map((channel) => (
                    <div key={channel.platform} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted">
                        <PlatformIcon platform={channel.platform} size={16} />
                        {PLATFORM_SHORT_LABELS[channel.platform]}
                      </span>
                      <span className="font-medium text-foreground">
                        {channel.count.toLocaleString("nl-NL")} <span className="text-muted">({channel.percentage}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader title="Alerts in deze periode" />
              {data.alerts.length === 0 ? (
                <p className="text-sm text-muted">Geen alerts in deze periode.</p>
              ) : (
                <div className="space-y-3">
                  {data.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{alert.topicLabel}</p>
                        <p className="text-xs text-muted">
                          {alert.increasePercentage}% toename · {formatTimeAgo(minutesSince(alert.createdAt))}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {alert.resolved && (
                          <span className="rounded-full bg-neutral-bg px-2.5 py-1 text-xs font-medium text-neutral">Opgelost</span>
                        )}
                        <PriorityBadge priority={alert.priority} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
