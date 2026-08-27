"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronRight,
  LayoutGrid,
  List,
  MessagesSquare,
  Radio,
  Search,
} from "lucide-react";
import clsx from "clsx";
import { PageHeader, DateRangeButton, FiltersButton, NotificationBell, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DonutChart } from "@/components/charts/DonutChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { ReviewRow } from "@/components/feedback/ReviewRow";
import { Pagination } from "@/components/feedback/Pagination";
import type { Platform, Sentiment } from "@/lib/types";
import {
  allReviews,
  feedbackTabCounts,
  PLATFORM_LABELS,
  platformReviews,
  platformScoreDistribution,
  platformSentiment,
  platformSentimentCounts,
  platformTopTopics,
  platformTrend,
} from "@/lib/dummy-data";
import { CHART_COLORS } from "@/lib/chart-colors";

type Tab = Platform | "all";

const PAGE_SIZE = 10;

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<"all" | Sentiment>("all");
  const [scoreFilter, setScoreFilter] = useState<"all" | number>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);

  const sourceReviews = activeTab === "all" ? allReviews : platformReviews[activeTab];

  const categoryOptions = useMemo(
    () => Array.from(new Set(sourceReviews.flatMap((r) => r.topics))).sort(),
    [sourceReviews]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = sourceReviews.filter((review) => {
      if (query && !review.text.toLowerCase().includes(query) && !review.author.toLowerCase().includes(query)) {
        return false;
      }
      if (sentimentFilter !== "all" && review.sentiment !== sentimentFilter) return false;
      if (scoreFilter !== "all" && Math.round(review.rating) !== scoreFilter) return false;
      if (categoryFilter !== "all" && !review.topics.includes(categoryFilter)) return false;
      return true;
    });
    return list.sort((a, b) => (sortNewestFirst ? a.minutesAgo - b.minutesAgo : b.minutesAgo - a.minutesAgo));
  }, [sourceReviews, search, sentimentFilter, scoreFilter, categoryFilter, sortNewestFirst]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    setPage(1);
    setCategoryFilter("all");
  }

  function updateFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const isSinglePlatform = activeTab !== "all";
  const sentiment = isSinglePlatform ? platformSentiment[activeTab] : null;
  const sentimentCounts = isSinglePlatform ? platformSentimentCounts[activeTab] : null;
  const trend = isSinglePlatform ? platformTrend[activeTab] : null;
  const scoreDistribution = isSinglePlatform ? platformScoreDistribution[activeTab] : null;
  const topTopics = isSinglePlatform ? platformTopTopics[activeTab] : null;

  return (
    <>
      <PageHeader
        title="Feedback"
        breadcrumb={
          isSinglePlatform ? (
            <>
              <button onClick={() => selectTab("all")} className="hover:text-foreground">
                Alle feedback
              </button>
              <ChevronRight size={14} />
              <span className="flex items-center gap-1.5 text-foreground">
                <PlatformIcon platform={activeTab} size={14} />
                {PLATFORM_LABELS[activeTab]}
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

      <div className="flex flex-wrap gap-2">
        {feedbackTabCounts.map(({ platform, count }) => {
          const active = activeTab === platform;
          return (
            <button
              key={platform}
              onClick={() => selectTab(platform)}
              className={clsx(
                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-brand bg-surface-elevated text-foreground"
                  : "border-border bg-surface text-muted hover:text-foreground"
              )}
            >
              {platform === "all" ? (
                <MessagesSquare size={16} />
              ) : (
                <PlatformIcon platform={platform} size={16} />
              )}
              {platform === "all" ? "Alle feedback" : PLATFORM_LABELS[platform]}
              <span className="text-xs text-muted">{count.toLocaleString("nl-NL")}</span>
            </button>
          );
        })}
      </div>

      {isSinglePlatform && sentiment && sentimentCounts && trend && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={activeTab} size={22} />
                <div>
                  <p className="text-base font-semibold text-foreground">{PLATFORM_LABELS[activeTab]}</p>
                  <p className="text-xs text-muted">
                    {feedbackTabCounts.find((t) => t.platform === activeTab)?.count.toLocaleString("nl-NL")} reviews
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-positive">
                <span className="h-1.5 w-1.5 rounded-full bg-positive" /> Live-updates
              </span>
            </div>
            <p className="mb-3 text-sm font-medium text-foreground">Sentiment overzicht</p>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <DonutChart
                size={160}
                centerValue={`${sentiment.positive}%`}
                centerLabel="Positief"
                data={[
                  { name: "Positief", value: sentiment.positive, color: CHART_COLORS.positive },
                  { name: "Negatief", value: sentiment.negative, color: CHART_COLORS.negative },
                  { name: "Neutraal", value: sentiment.neutral, color: CHART_COLORS.neutral },
                ]}
              />
              <div className="w-full space-y-3">
                {[
                  { label: "Positief", pct: sentiment.positive, count: sentimentCounts.positive, color: CHART_COLORS.positive },
                  { label: "Negatief", pct: sentiment.negative, count: sentimentCounts.negative, color: CHART_COLORS.negative },
                  { label: "Neutraal", pct: sentiment.neutral, count: sentimentCounts.neutral, color: CHART_COLORS.neutral },
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
            <p className="mt-4 text-xs text-muted-foreground">Laatste update: zojuist</p>
          </Card>

          <Card>
            <CardHeader title="Ontwikkeling in de tijd" />
            <TrendLineChart
              data={trend}
              lines={[
                { key: "positive", color: CHART_COLORS.positive, label: "Positief" },
                { key: "negative", color: CHART_COLORS.negative, label: "Negatief" },
                { key: "neutral", color: CHART_COLORS.neutral, label: "Neutraal" },
              ]}
            />
          </Card>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => updateFilter(setSearch)(e.target.value)}
            placeholder="Zoek in feedback..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
          />
        </div>

        <select
          value={sentimentFilter}
          onChange={(e) => updateFilter(setSentimentFilter)(e.target.value as "all" | Sentiment)}
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none"
        >
          <option value="all">Sentiment</option>
          <option value="positive">Positief</option>
          <option value="negative">Negatief</option>
          <option value="neutral">Neutraal</option>
        </select>

        <select
          value={scoreFilter}
          onChange={(e) => updateFilter(setScoreFilter)(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none"
        >
          <option value="all">Score</option>
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>
              {s} sterren
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => updateFilter(setCategoryFilter)(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none"
        >
          <option value="all">Categorie</option>
          {categoryOptions.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSortNewestFirst((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground hover:bg-surface-elevated"
        >
          <ArrowUpDown size={15} className="text-muted" />
          {sortNewestFirst ? "Nieuwste eerst" : "Oudste eerst"}
        </button>

        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              viewMode === "list" ? "bg-brand text-[#0a0a0a]" : "text-muted hover:text-foreground"
            )}
            aria-label="Lijstweergave"
          >
            <List size={15} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              viewMode === "grid" ? "bg-brand text-[#0a0a0a]" : "text-muted hover:text-foreground"
            )}
            aria-label="Rasterweergave"
          >
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      <div className={clsx("mt-6 gap-6", isSinglePlatform ? "grid grid-cols-1 lg:grid-cols-[280px_1fr]" : "flex")}>
        {isSinglePlatform && scoreDistribution && topTopics && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Verdeling per score" />
              <div className="space-y-3">
                {scoreDistribution.map((row) => (
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
              <div className="space-y-4">
                {topTopics.map((topic) => (
                  <div key={topic.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-foreground">{topic.label}</span>
                      <span className="font-medium text-muted">{topic.percentage}%</span>
                    </div>
                    <ProgressBar percentage={topic.percentage} color={CHART_COLORS.brand} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className="min-w-0 flex-1">
          {paged.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Radio size={24} className="text-muted" />
              <p className="text-sm font-medium text-foreground">Geen feedback gevonden</p>
              <p className="text-sm text-muted">Probeer een andere zoekterm of pas de filters aan.</p>
            </Card>
          ) : (
            <div className={clsx(viewMode === "grid" ? "grid grid-cols-1 gap-4 xl:grid-cols-2" : "space-y-3")}>
              {paged.map((review) => (
                <ReviewRow key={review.id} review={review} view={viewMode} />
              ))}
            </div>
          )}

          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </>
  );
}
