import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, BarChart3, Lightbulb, Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { PageHeader, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PriorityBadge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { PLATFORM_SHORT_LABELS, formatTimeAgo, minutesSince } from "@/lib/dummy-data";
import { CHART_COLORS } from "@/lib/chart-colors";
import { getSession } from "@/lib/auth";
import { getAnalysisData } from "@/lib/data/analysis";
import { REPORT_PERIOD_LABELS, type ReportPeriod } from "@/lib/data/reports";

const PERIODS: ReportPeriod[] = ["week", "month", "quarter"];

function GatedPanel({ title, note }: { title: string; note: string }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-interest-bg text-interest">
          <Sparkles size={18} />
        </div>
        <p className="max-w-xs text-sm text-muted">{note}</p>
      </div>
    </Card>
  );
}

const TREND_META: Record<
  "worse" | "better" | "flat",
  { label: string; icon: typeof TrendingUp; className: string }
> = {
  worse: { label: "Verslechterd", icon: TrendingUp, className: "text-negative" },
  better: { label: "Verbeterd", icon: TrendingDown, className: "text-positive" },
  flat: { label: "Stabiel", icon: Minus, className: "text-muted" },
};

export default async function AnalysePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const periodParam = typeof params.period === "string" ? params.period : "month";
  const period: ReportPeriod = PERIODS.includes(periodParam as ReportPeriod) ? (periodParam as ReportPeriod) : "month";

  const session = await getSession();
  const data = session ? await getAnalysisData(session.companyId, period) : null;

  return (
    <>
      <PageHeader
        title="Analyse"
        subtitle="Diepgaande trends over je feedback, en de oplossingen die onze AI voorstelt."
        actions={<UserMenu />}
      />

      <div className="mb-6 inline-flex rounded-xl border border-border bg-surface p-1">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={`/analyse?period=${p}`}
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
            <BarChart3 size={22} />
          </div>
          <p className="text-base font-semibold text-foreground">Nog geen data voor deze periode</p>
          <p className="max-w-sm text-sm text-muted">
            Zodra er feedback binnenkomt, verschijnen hier trends, kanaalvergelijkingen en AI-oplossingen.
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader title="Sentiment-trend" subtitle="Positief, negatief en neutraal naast elkaar over tijd" />
            <TrendLineChart
              data={data.sentimentTrend}
              lines={[
                { key: "positive", color: CHART_COLORS.positive, label: "Positief" },
                { key: "negative", color: CHART_COLORS.negative, label: "Negatief" },
                { key: "neutral", color: CHART_COLORS.neutral, label: "Neutraal" },
              ]}
            />
          </Card>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Kanalen-vergelijking" />
              {data.channels.length === 0 ? (
                <p className="text-sm text-muted">Nog geen kanalen met data.</p>
              ) : (
                <div className="space-y-4">
                  {data.channels.map((channel) => (
                    <div key={channel.platform} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        <PlatformIcon platform={channel.platform} size={18} />
                        {PLATFORM_SHORT_LABELS[channel.platform]}
                      </span>
                      <div className="flex shrink-0 items-center gap-3">
                        {channel.averageRating !== null && <StarRating rating={channel.averageRating} />}
                        <span className="w-24 whitespace-nowrap text-right text-sm font-medium text-foreground">
                          {channel.positivePercent}% <span className="text-muted">pos.</span>
                        </span>
                        <span className="w-16 whitespace-nowrap text-right text-xs text-muted">{channel.count} stuks</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Verdeling per score" />
              {data.ratingDistribution.every((b) => b.count === 0) ? (
                <p className="text-sm text-muted">Geen kanalen met sterrenscores in deze periode.</p>
              ) : (
                <div className="space-y-3">
                  {[...data.ratingDistribution].reverse().map((bucket) => {
                    const max = Math.max(...data.ratingDistribution.map((b) => b.count), 1);
                    const pct = Math.round((bucket.count / max) * 100);
                    return (
                      <div key={bucket.rating}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="text-foreground">{bucket.rating} sterren</span>
                          <span className="font-medium text-muted">{bucket.count}</span>
                        </div>
                        <ProgressBar percentage={pct} color={CHART_COLORS.brand} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="mt-6">
            {data.hasClassifiedData ? (
              <Card>
                <CardHeader
                  title="Onderwerpen-analyse"
                  subtitle="Welke onderwerpen verslechteren of verbeteren t.o.v. de vorige periode"
                />
                {data.topics.length === 0 ? (
                  <p className="text-sm text-muted">Nog geen onderwerpen herkend in deze periode.</p>
                ) : (
                  <div className="space-y-4">
                    {data.topics.map((topic) => {
                      const meta = TREND_META[topic.trend];
                      const Icon = meta.icon;
                      return (
                        <div key={topic.label} className="flex items-center justify-between gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{topic.label}</p>
                            <p className="text-xs text-muted">
                              {topic.count} vermeldingen · {topic.positivePercent}% positief · {topic.negativePercent}% negatief
                            </p>
                          </div>
                          <span className={clsx("flex shrink-0 items-center gap-1.5 text-xs font-medium", meta.className)}>
                            <Icon size={14} />
                            {meta.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            ) : (
              <GatedPanel
                title="Onderwerpen-analyse"
                note="Onderwerpen en trends worden zichtbaar zodra reviews door AI geclassificeerd zijn."
              />
            )}
          </div>

          <div className="mt-6">
            {data.hasClassifiedData ? (
              <Card>
                <CardHeader
                  title="AI-oplossingen"
                  subtitle="Concrete suggesties van onze AI op basis van gesignaleerde problemen"
                  action={
                    <Link
                      href="/alerts"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand"
                    >
                      Alle alerts <ArrowRight size={14} />
                    </Link>
                  }
                />
                {data.aiSolutions.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-solution-bg text-solution">
                      <Lightbulb size={18} />
                    </div>
                    <p className="max-w-xs text-sm text-muted">
                      Zodra AI een opkomend probleem signaleert, verschijnt hier een concrete oplossingssuggestie.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.aiSolutions.map((solution) => (
                      <div key={solution.id} className={clsx("rounded-xl border border-border p-4", solution.resolved && "opacity-60")}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{solution.topicLabel}</p>
                            <p className="text-xs text-muted">
                              {solution.increasePercentage}% toename · {solution.reviewCount} reviews ·{" "}
                              {formatTimeAgo(minutesSince(solution.createdAt))}
                            </p>
                          </div>
                          <PriorityBadge priority={solution.priority} />
                        </div>
                        <div className="mt-3 rounded-xl border border-solution/30 bg-solution-bg p-4">
                          <p className="text-sm font-semibold text-solution">AI-oplossingssuggestie</p>
                          <p className="mt-1 text-sm leading-relaxed text-foreground/90">{solution.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : (
              <GatedPanel
                title="AI-oplossingen"
                note="Zodra reviews door AI geclassificeerd zijn en er een probleem wordt gesignaleerd, verschijnen hier concrete oplossingssuggesties."
              />
            )}
          </div>
        </>
      )}
    </>
  );
}
