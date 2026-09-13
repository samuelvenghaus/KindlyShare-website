import Link from "next/link";
import clsx from "clsx";
import { ChevronRight, MessagesSquare, Radio } from "lucide-react";
import { PageHeader, DateRangeButton, FiltersButton, NotificationBell, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DonutChart } from "@/components/charts/DonutChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { ReviewRow } from "@/components/feedback/ReviewRow";
import { Pagination } from "@/components/feedback/Pagination";
import { FeedbackFilterBar } from "@/components/feedback/FeedbackFilterBar";
import { PLATFORM_LABELS } from "@/lib/dummy-data";
import type { Platform, Sentiment } from "@/lib/types";
import { CHART_COLORS } from "@/lib/chart-colors";
import { getSession } from "@/lib/auth";
import {
  FEEDBACK_PAGE_SIZE,
  getFeedbackData,
  type FeedbackTab,
  type ScoreFilter,
  type SentimentFilter,
  type SortOrder,
} from "@/lib/data/feedback";

const KNOWN_PLATFORMS: Platform[] = ["google", "trustpilot", "app_store", "instagram", "facebook", "tiktok", "overig"];
const KNOWN_SENTIMENTS: Sentiment[] = ["positive", "negative", "neutral"];

function parseTab(value: string | string[] | undefined): FeedbackTab {
  if (typeof value === "string" && KNOWN_PLATFORMS.includes(value as Platform)) return value as Platform;
  return "all";
}

function parseSentiment(value: string | string[] | undefined): SentimentFilter {
  if (typeof value === "string" && KNOWN_SENTIMENTS.includes(value as Sentiment)) return value as Sentiment;
  return "all";
}

function parseScore(value: string | string[] | undefined): ScoreFilter {
  if (typeof value === "string") {
    const n = Number(value);
    if (n >= 1 && n <= 5) return n;
  }
  return "all";
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const q = typeof params.q === "string" ? params.q : "";
  const sentiment = parseSentiment(params.sentiment);
  const score = parseScore(params.score);
  const category = typeof params.category === "string" ? params.category : "all";
  const sort: SortOrder = params.sort === "oldest" ? "oldest" : "newest";
  const view = params.view === "grid" ? "grid" : "list";
  const page = Math.max(1, Number(params.page) || 1);

  const session = await getSession();
  const data = session
    ? await getFeedbackData(session.companyId, { tab, q, sentiment, score, category, sort, page })
    : null;

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / FEEDBACK_PAGE_SIZE)) : 1;
  const isSinglePlatform = tab !== "all";

  function buildHref(overrides: Record<string, string | number | undefined>): string {
    const searchParamsObj = new URLSearchParams();
    const base: Record<string, string | number | undefined> = { tab, q, sentiment, score, category, sort, view, page, ...overrides };
    for (const [key, value] of Object.entries(base)) {
      if (value === undefined || value === "all" || value === "" || (key === "page" && value === 1)) continue;
      searchParamsObj.set(key, String(value));
    }
    const query = searchParamsObj.toString();
    return query ? `/feedback?${query}` : "/feedback";
  }

  return (
    <>
      <PageHeader
        title="Feedback"
        breadcrumb={
          isSinglePlatform ? (
            <>
              <Link href={buildHref({ tab: undefined, category: undefined, page: undefined })} className="hover:text-foreground">
                Alle feedback
              </Link>
              <ChevronRight size={14} />
              <span className="flex items-center gap-1.5 text-foreground">
                <PlatformIcon platform={tab} size={14} />
                {PLATFORM_LABELS[tab]}
              </span>
            </>
          ) : undefined
        }
        subtitle={!isSinglePlatform ? "Bekijk alle live feedback van je verbonden kanalen in één overzicht." : undefined}
        actions={
          <>
            <DateRangeButton />
            <FiltersButton />
            <NotificationBell />
            <UserMenu />
          </>
        }
      />

      {!data ? null : (
        <>
          <div className="flex flex-wrap gap-2">
            {data.tabCounts.map(({ platform, count }) => {
              const active = tab === platform;
              return (
                <Link
                  key={platform}
                  href={buildHref({ tab: platform === "all" ? undefined : platform, category: undefined, page: undefined })}
                  className={clsx(
                    "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-brand bg-surface-elevated text-foreground"
                      : "border-border bg-surface text-muted hover:text-foreground"
                  )}
                >
                  {platform === "all" ? <MessagesSquare size={16} /> : <PlatformIcon platform={platform} size={16} />}
                  {platform === "all" ? "Alle feedback" : PLATFORM_LABELS[platform]}
                  <span className="text-xs text-muted">{count.toLocaleString("nl-NL")}</span>
                </Link>
              );
            })}
          </div>

          {isSinglePlatform && data.platformPanel && (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={tab} size={22} />
                    <div>
                      <p className="text-base font-semibold text-foreground">{PLATFORM_LABELS[tab]}</p>
                      <p className="text-xs text-muted">{data.platformPanel.totalReviews.toLocaleString("nl-NL")} reviews</p>
                    </div>
                  </div>
                </div>
                <p className="mb-3 text-sm font-medium text-foreground">Sentiment overzicht</p>
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <DonutChart
                    size={160}
                    centerValue={`${data.platformPanel.sentimentPercent.positive}%`}
                    centerLabel="Positief"
                    data={[
                      { name: "Positief", value: data.platformPanel.sentimentCounts.positive, color: CHART_COLORS.positive },
                      { name: "Negatief", value: data.platformPanel.sentimentCounts.negative, color: CHART_COLORS.negative },
                      { name: "Neutraal", value: data.platformPanel.sentimentCounts.neutral, color: CHART_COLORS.neutral },
                    ]}
                  />
                  <div className="w-full space-y-3">
                    {[
                      { label: "Positief", pct: data.platformPanel.sentimentPercent.positive, count: data.platformPanel.sentimentCounts.positive, color: CHART_COLORS.positive },
                      { label: "Negatief", pct: data.platformPanel.sentimentPercent.negative, count: data.platformPanel.sentimentCounts.negative, color: CHART_COLORS.negative },
                      { label: "Neutraal", pct: data.platformPanel.sentimentPercent.neutral, count: data.platformPanel.sentimentCounts.neutral, color: CHART_COLORS.neutral },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted">{row.label}</span>
                          <span className="font-medium text-foreground">
                            {row.pct}% <span className="text-muted">({row.count.toLocaleString("nl-NL")} reviews)</span>
                          </span>
                        </div>
                        <div className="mt-1">
                          <ProgressBar percentage={row.pct} color={row.color} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Ontwikkeling in de tijd" />
                <TrendLineChart
                  data={data.platformPanel.trend}
                  lines={[
                    { key: "positive", color: CHART_COLORS.positive, label: "Positief" },
                    { key: "negative", color: CHART_COLORS.negative, label: "Negatief" },
                    { key: "neutral", color: CHART_COLORS.neutral, label: "Neutraal" },
                  ]}
                />
              </Card>
            </div>
          )}

          <FeedbackFilterBar categoryOptions={data.categoryOptions} />

          <div className={clsx("mt-6 gap-6", isSinglePlatform && data.platformPanel ? "grid grid-cols-1 lg:grid-cols-[280px_1fr]" : "flex")}>
            {isSinglePlatform && data.platformPanel && (
              <div className="space-y-6">
                <Card>
                  <CardHeader title="Verdeling per score" />
                  <div className="space-y-3">
                    {data.platformPanel.scoreDistribution.map((row) => (
                      <div key={row.stars} className="flex items-center gap-3 text-sm">
                        <span className="w-16 shrink-0 text-muted">{row.stars} sterren</span>
                        <div className="flex-1">
                          <ProgressBar
                            percentage={row.percentage}
                            color={row.stars >= 4 ? CHART_COLORS.positive : row.stars === 3 ? CHART_COLORS.neutral : CHART_COLORS.negative}
                          />
                        </div>
                        <span className="w-20 shrink-0 text-right text-muted">
                          {row.count} ({row.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Meest genoemde onderwerpen" />
                  {data.platformPanel.topTopics.length === 0 ? (
                    <p className="text-sm text-muted">Nog geen onderwerpen herkend.</p>
                  ) : (
                    <div className="space-y-4">
                      {data.platformPanel.topTopics.map((topic) => (
                        <div key={topic.label}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="text-foreground">{topic.label}</span>
                            <span className="font-medium text-muted">{topic.percentage}%</span>
                          </div>
                          <ProgressBar percentage={topic.percentage} color={CHART_COLORS.brand} />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            <div className="min-w-0 flex-1">
              {data.reviews.length === 0 ? (
                <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <Radio size={24} className="text-muted" />
                  <p className="text-sm font-medium text-foreground">Geen feedback gevonden</p>
                  <p className="text-sm text-muted">Probeer een andere zoekterm of pas de filters aan.</p>
                </Card>
              ) : (
                <div className={clsx(view === "grid" ? "grid grid-cols-1 gap-4 xl:grid-cols-2" : "space-y-3")}>
                  {data.reviews.map((review) => (
                    <ReviewRow key={review.id} review={review} view={view} />
                  ))}
                </div>
              )}

              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={data.totalCount}
                pageSize={FEEDBACK_PAGE_SIZE}
                buildHref={(p) => buildHref({ page: p === 1 ? undefined : p })}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
