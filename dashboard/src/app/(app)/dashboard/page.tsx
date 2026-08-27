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
import { SentimentBadge } from "@/components/ui/Badge";
import { DonutChart } from "@/components/charts/DonutChart";
import { AreaTrendChart } from "@/components/charts/AreaTrendChart";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { PLATFORM_SHORT_LABELS, formatTimeAgo } from "@/lib/dummy-data";
import { CHART_COLORS, PLATFORM_COLORS } from "@/lib/chart-colors";
import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";

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
            <Card>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-solution-bg text-solution">
                <Lightbulb size={20} />
              </div>
              <p className="text-sm text-muted">Oplossingen</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight text-muted-foreground">–</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Beschikbaar na AI-classificatie (Fase 4)</p>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GatedPanel
              title="Feedback Overzicht"
              note="De verdeling in Praise / Interest / Problems / Solutions wordt zichtbaar zodra AI-classificatie actief is (Fase 4)."
            />

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
            <GatedPanel
              title="Meest genoemde onderwerpen"
              note="Onderwerpen worden automatisch herkend zodra AI-classificatie actief is (Fase 4)."
            />

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
                          {review.sentiment ? (
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
    </>
  );
}
