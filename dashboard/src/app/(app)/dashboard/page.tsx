import { ArrowRight, Lightbulb, MessageSquareText, Smile, TriangleAlert } from "lucide-react";
import { PageHeader, DateRangeButton, UserMenu } from "@/components/layout/HeaderWidgets";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FeedbackTypeBadge } from "@/components/ui/Badge";
import { DonutChart } from "@/components/charts/DonutChart";
import { AreaTrendChart } from "@/components/charts/AreaTrendChart";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { ProblemAlert } from "@/components/alerts/ProblemAlert";
import {
  dashboardChannels,
  dashboardFeedbackTrend,
  dashboardFeedbackTrendTickInterval,
  dashboardKpis,
  dashboardRecentFeedback,
  dashboardTopTopics,
  exampleAlert,
  feedbackTypeBreakdown,
  formatTimeAgo,
  PLATFORM_SHORT_LABELS,
} from "@/lib/dummy-data";
import { CHART_COLORS, PLATFORM_COLORS } from "@/lib/chart-colors";

const feedbackTypeColor: Record<string, string> = {
  praise: CHART_COLORS.positive,
  interest: CHART_COLORS.interest,
  problem: CHART_COLORS.negative,
  solution: CHART_COLORS.solution,
};

const feedbackTypeLabel: Record<string, string> = {
  praise: "Praise",
  interest: "Interest",
  problem: "Problems",
  solution: "Solutions",
};

export default function DashboardPage() {
  const totalFeedbackType = feedbackTypeBreakdown.reduce((sum, item) => sum + item.count, 0);
  const totalChannels = dashboardChannels.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welkom terug, Samuel! 👋"
        actions={
          <>
            <DateRangeButton />
            <UserMenu />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MessageSquareText}
          iconClassName="bg-interest-bg text-interest"
          label="Totaal feedback"
          value={dashboardKpis.totalFeedback.value.toLocaleString("nl-NL")}
          changePercent={dashboardKpis.totalFeedback.changePercent}
        />
        <StatCard
          icon={Smile}
          iconClassName="bg-positive-bg text-positive"
          label="Positieve feedback"
          value={dashboardKpis.positiveFeedback.value.toLocaleString("nl-NL")}
          changePercent={dashboardKpis.positiveFeedback.changePercent}
        />
        <StatCard
          icon={TriangleAlert}
          iconClassName="bg-negative-bg text-negative"
          label="Problemen"
          value={dashboardKpis.problems.value.toLocaleString("nl-NL")}
          changePercent={dashboardKpis.problems.changePercent}
        />
        <StatCard
          icon={Lightbulb}
          iconClassName="bg-solution-bg text-solution"
          label="Oplossingen"
          value={dashboardKpis.solutions.value.toLocaleString("nl-NL")}
          changePercent={dashboardKpis.solutions.changePercent}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Feedback Overzicht" />
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <DonutChart
              centerValue={totalFeedbackType.toLocaleString("nl-NL")}
              centerLabel="Totaal"
              data={feedbackTypeBreakdown.map((item) => ({
                name: feedbackTypeLabel[item.type],
                value: item.count,
                color: feedbackTypeColor[item.type],
              }))}
            />
            <div className="w-full space-y-3">
              {feedbackTypeBreakdown.map((item) => (
                <div key={item.type} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: feedbackTypeColor[item.type] }}
                    />
                    {feedbackTypeLabel[item.type]}
                  </span>
                  <span className="font-medium text-foreground">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Feedback trend"
            action={
              <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground">
                Dagelijks
              </button>
            }
          />
          <AreaTrendChart
            data={dashboardFeedbackTrend}
            color={CHART_COLORS.positive}
            tickInterval={dashboardFeedbackTrendTickInterval}
          />
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Meest genoemde onderwerpen" />
          <div className="space-y-4">
            {dashboardTopTopics.map((topic) => (
              <div key={topic.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-foreground">{topic.label}</span>
                  <span className="font-medium text-muted">{topic.percentage}%</span>
                </div>
                <ProgressBar percentage={topic.percentage} color={CHART_COLORS.brand} />
              </div>
            ))}
          </div>
          <a href="/analyse" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand">
            Bekijk alle onderwerpen <ArrowRight size={14} />
          </a>
        </Card>

        <Card>
          <CardHeader title="Recente feedback" />
          <div className="space-y-4">
            {dashboardRecentFeedback.map((review) => (
              <div key={review.id} className="flex items-start gap-3">
                <PlatformIcon platform={review.platform} size={22} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{review.text}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <FeedbackTypeBadge type={review.feedbackType} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {PLATFORM_SHORT_LABELS[review.platform]} · {formatTimeAgo(review.minutesAgo)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <a href="/feedback" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand">
            Bekijk alle feedback <ArrowRight size={14} />
          </a>
        </Card>

        <Card>
          <CardHeader title="Kanalen overzicht" />
          <div className="flex items-center gap-6">
            <DonutChart
              size={140}
              centerValue={totalChannels.toLocaleString("nl-NL")}
              centerLabel="Totaal"
              data={dashboardChannels.map((channel) => ({
                name: PLATFORM_SHORT_LABELS[channel.platform],
                value: channel.count,
                color: PLATFORM_COLORS[channel.platform],
              }))}
            />
            <div className="min-w-0 flex-1 space-y-2.5">
              {dashboardChannels.map((channel) => (
                <div key={channel.platform} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted">
                    <PlatformIcon platform={channel.platform} size={16} />
                    {PLATFORM_SHORT_LABELS[channel.platform]}
                  </span>
                  <span className="font-medium text-foreground">
                    {channel.count.toLocaleString("nl-NL")}{" "}
                    <span className="text-muted">({channel.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <a href="/kanalen" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand">
            Bekijk alle kanalen <ArrowRight size={14} />
          </a>
        </Card>
      </div>

      <ProblemAlert alert={exampleAlert} />
    </>
  );
}
