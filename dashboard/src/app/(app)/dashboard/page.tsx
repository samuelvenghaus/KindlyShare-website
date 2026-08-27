import Link from "next/link";
import {
  ArrowRight,
  Lightbulb,
  MessageSquareText,
  Radio,
  Smile,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { PageHeader, DateRangeButton, UserMenu } from "@/components/layout/HeaderWidgets";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SentimentBadge, FeedbackTypeBadge } from "@/components/ui/Badge";
import { DonutChart } from "@/components/charts/DonutChart";
import { AreaTrendChart } from "@/components/charts/AreaTrendChart";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { PLATFORM_SHORT_LABELS, formatTimeAgo } from "@/lib/dummy-data";
import { CHART_COLORS, PLATFORM_COLORS } from "@/lib/chart-colors";
import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { getLatestUnresolvedAlert } from "@/lib/data/alerts";
import { ProblemAlert } from "@/components/alerts/ProblemAlert";

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

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.name.split(" ")[0] ?? "";
  const data = session ? await getDashboardData(session.companyId) : null;
  const activeAlert = session ? await getLatestUnresolvedAlert(session.companyId) : null;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welkom terug${firstName ? `, ${firstName}` : ""}! 👋`}
        actions={
          <>
            <DateRangeButton />
            <UserMenu />
          </>
        }
      />

      {!data?.hasConnections && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-interest-bg text-interest">
            <Radio size={22} />
          </div>
          <p className="text-base font-semibold text-foreground">Nog geen kanalen gekoppeld</p>
          <p className="max-w-sm text-sm text-muted">
            Verbind je Google Bedrijfsprofiel om automatisch reviews te verzamelen en hier te zien.
          </p>
          <Link
            href="/kanalen"
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-95"
          >
            Kanaal koppelen <ArrowRight size={14} />
          </Link>
        </Card>
      )}

      {data?.hasConnections && !data.hasReviews && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-interest-bg text-interest">
            <MessageSquareText size={22} />
          </div>
          <p className="text-base font-semibold text-foreground">Nog geen feedback binnengehaald</p>
          <p className="max-w-sm text-sm text-muted">
            Je kanaal is gekoppeld, maar er zijn nog geen reviews opgehaald. Ga naar Kanalen om handmatig te
            synchroniseren.
          </p>
          <Link
            href="/kanalen"
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-95"
          >
            Naar Kanalen <ArrowRight size={14} />
          </Link>
        </Card>
      )}

      {data?.hasReviews && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={MessageSquareText}
              iconClassName="bg-interest-bg text-interest"
              label="Totaal feedback"
              value={data.totalFeedback.value.toLocaleString("nl-NL")}
              changePercent={data.totalFeedback.changePercent}
            />
            <StatCard
              icon={Smile}
              iconClassName="bg-positive-bg text-positive"
              label="Positieve feedback"
              value={data.positiveFeedback.value.toLocaleString("nl-NL")}
              changePercent={data.positiveFeedback.changePercent}
            />
            <StatCard
              icon={TriangleAlert}
              iconClassName="bg-negative-bg text-negative"
              label="Problemen"
              value={data.problems.value.toLocaleString("nl-NL")}
              changePercent={data.problems.changePercent}
            />
            {data.hasClassifiedData ? (
              <StatCard
                icon={Lightbulb}
                iconClassName="bg-solution-bg text-solution"
                label="Oplossingen"
                value={data.solutions.value.toLocaleString("nl-NL")}
                changePercent={data.solutions.changePercent}
              />
            ) : (
              <Card>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-solution-bg text-solution">
                  <Lightbulb size={20} />
                </div>
                <p className="text-sm text-muted">Oplossingen</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-tight text-muted-foreground">–</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Beschikbaar na AI-classificatie</p>
              </Card>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {data.hasClassifiedData ? (
              <Card>
                <CardHeader title="Feedback Overzicht" />
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                  <DonutChart
                    centerValue={data.feedbackTypeBreakdown
                      .reduce((s, item) => s + item.count, 0)
                      .toLocaleString("nl-NL")}
                    centerLabel="Totaal"
                    data={data.feedbackTypeBreakdown
                      .filter((item) => item.count > 0)
                      .map((item) => ({
                        name: FEEDBACK_TYPE_NAME[item.type],
                        value: item.count,
                        color: FEEDBACK_TYPE_COLOR[item.type],
                      }))}
                  />
                  <div className="w-full space-y-3">
                    {data.feedbackTypeBreakdown.map((item) => {
                      const total = data.feedbackTypeBreakdown.reduce((s, i) => s + i.count, 0);
                      const pct = total === 0 ? 0 : Math.round((item.count / total) * 1000) / 10;
                      return (
                        <div key={item.type} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: FEEDBACK_TYPE_COLOR[item.type] }}
                            />
                            {FEEDBACK_TYPE_NAME[item.type]}
                          </span>
                          <span className="font-medium text-foreground">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ) : (
              <GatedPanel
                title="Feedback Overzicht"
                note="De verdeling in Praise / Interest / Problems / Solutions wordt zichtbaar zodra reviews door AI geclassificeerd zijn."
              />
            )}

            <Card>
              <CardHeader
                title="Feedback trend"
                action={
                  <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground">
                    Dagelijks
                  </button>
                }
              />
              <AreaTrendChart data={data.trend} color={CHART_COLORS.positive} tickInterval={6} />
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {data.topTopics.length > 0 ? (
              <Card>
                <CardHeader title="Meest genoemde onderwerpen" />
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
              </Card>
            ) : (
              <GatedPanel
                title="Meest genoemde onderwerpen"
                note="Onderwerpen worden automatisch herkend zodra reviews door AI geclassificeerd zijn."
              />
            )}

            <Card>
              <CardHeader title="Recente feedback" />
              {data.recentReviews.length === 0 ? (
                <p className="text-sm text-muted">Nog geen reviews.</p>
              ) : (
                <div className="space-y-4">
                  {data.recentReviews.map((review) => (
                    <div key={review.id} className="flex items-start gap-3">
                      <PlatformIcon platform={review.platform} size={22} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{review.text ?? "(Geen tekst)"}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          {review.feedbackType ? (
                            <FeedbackTypeBadge type={review.feedbackType} />
                          ) : review.sentiment ? (
                            <SentimentBadge sentiment={review.sentiment} />
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-neutral-bg px-2.5 py-1 text-xs font-medium text-neutral">
                              Nog niet beoordeeld
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {PLATFORM_SHORT_LABELS[review.platform]} · {formatTimeAgo(review.minutesAgo)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link
                href="/feedback"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand"
              >
                Bekijk alle feedback <ArrowRight size={14} />
              </Link>
            </Card>

            <Card>
              <CardHeader title="Kanalen overzicht" />
              {data.channels.length === 0 ? (
                <p className="text-sm text-muted">Nog geen kanalen met data.</p>
              ) : (
                <div className="flex items-center gap-6">
                  <DonutChart
                    size={140}
                    centerValue={data.totalFeedback.value > 0 ? data.channels.reduce((s, c) => s + c.count, 0).toLocaleString("nl-NL") : "0"}
                    centerLabel="Totaal"
                    data={data.channels.map((channel) => ({
                      name: PLATFORM_SHORT_LABELS[channel.platform],
                      value: channel.count,
                      color: PLATFORM_COLORS[channel.platform],
                    }))}
                  />
                  <div className="min-w-0 flex-1 space-y-2.5">
                    {data.channels.map((channel) => (
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
              )}
              <Link
                href="/kanalen"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand"
              >
                Bekijk alle kanalen <ArrowRight size={14} />
              </Link>
            </Card>
          </div>
        </>
      )}

      {activeAlert && <ProblemAlert alert={activeAlert} />}
    </>
  );
}
