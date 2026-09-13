import "server-only";
import { prisma } from "@/lib/prisma";
import type { Platform, Priority, Sentiment, TrendPoint } from "@/lib/types";
import type { ReportPeriod } from "./reports";

const PERIOD_DAYS: Record<ReportPeriod, number> = { week: 7, month: 30, quarter: 90 };
const DUTCH_MONTHS_SHORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function formatDayLabel(date: Date): string {
  return `${date.getDate()} ${DUTCH_MONTHS_SHORT[date.getMonth()]}`;
}

function effectiveSentiment(review: { sentiment: Sentiment | null; rating: unknown }): Sentiment | null {
  if (review.sentiment) return review.sentiment;
  const rating = review.rating !== null && review.rating !== undefined ? Number(review.rating) : null;
  if (rating === null) return null;
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

interface ReviewForAnalysis {
  platform: Platform;
  sentiment: Sentiment | null;
  rating: unknown;
  postedAt: Date | null;
  feedbackType: string | null;
  topics: { topic: { label: string } }[];
}

interface ReviewForTopicTrend {
  sentiment: Sentiment | null;
  rating: unknown;
  topics: { topic: { label: string } }[];
}

function buildSentimentTrend(reviews: ReviewForAnalysis[], periodStart: Date, now: Date, bucketDays: number): TrendPoint[] {
  const buckets: { date: string; start: Date; end: Date; positive: number; negative: number; neutral: number }[] = [];
  let cursor = new Date(periodStart);
  while (cursor < now) {
    const end = new Date(Math.min(cursor.getTime() + bucketDays * 24 * 60 * 60 * 1000, now.getTime() + 1));
    buckets.push({ date: formatDayLabel(cursor), start: new Date(cursor), end, positive: 0, negative: 0, neutral: 0 });
    cursor = end;
  }

  for (const review of reviews) {
    if (!review.postedAt) continue;
    const sentiment = effectiveSentiment(review);
    if (!sentiment) continue;
    const bucket = buckets.find((b) => review.postedAt! >= b.start && review.postedAt! < b.end);
    if (bucket) bucket[sentiment] += 1;
  }

  return buckets.map(({ date, positive, negative, neutral }) => ({ date, positive, negative, neutral }));
}

function buildTopicSentimentMap(reviews: ReviewForTopicTrend[]): Map<string, { count: number; positive: number; negative: number }> {
  const map = new Map<string, { count: number; positive: number; negative: number }>();
  for (const review of reviews) {
    const sentiment = effectiveSentiment(review);
    for (const link of review.topics) {
      const label = link.topic.label;
      const entry = map.get(label) ?? { count: 0, positive: 0, negative: 0 };
      entry.count += 1;
      if (sentiment === "positive") entry.positive += 1;
      if (sentiment === "negative") entry.negative += 1;
      map.set(label, entry);
    }
  }
  return map;
}

export interface TopicAnalysis {
  label: string;
  count: number;
  positivePercent: number;
  negativePercent: number;
  trend: "worse" | "better" | "flat";
  trendDeltaPoints: number;
}

export interface ChannelComparison {
  platform: Platform;
  count: number;
  averageRating: number | null;
  positivePercent: number;
}

export interface RatingDistributionBucket {
  rating: number;
  count: number;
}

export interface AiSolution {
  id: string;
  topicLabel: string;
  priority: Priority;
  increasePercentage: number;
  reviewCount: number;
  suggestion: string;
  createdAt: Date;
  resolved: boolean;
}

export interface AnalysisData {
  hasReviews: boolean;
  hasClassifiedData: boolean;
  sentimentTrend: TrendPoint[];
  topics: TopicAnalysis[];
  channels: ChannelComparison[];
  ratingDistribution: RatingDistributionBucket[];
  aiSolutions: AiSolution[];
}

export async function getAnalysisData(companyId: string, period: ReportPeriod): Promise<AnalysisData> {
  const days = PERIOD_DAYS[period];
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

  const [currentReviews, previousReviews, alerts] = await Promise.all([
    prisma.review.findMany({
      where: { companyId, postedAt: { gte: periodStart }, isRelevant: true },
      select: {
        platform: true,
        sentiment: true,
        rating: true,
        postedAt: true,
        feedbackType: true,
        topics: { select: { topic: { select: { label: true } } } },
      },
    }),
    prisma.review.findMany({
      where: { companyId, postedAt: { gte: previousPeriodStart, lt: periodStart }, isRelevant: true },
      select: {
        sentiment: true,
        rating: true,
        topics: { select: { topic: { select: { label: true } } } },
      },
    }),
    prisma.alert.findMany({
      where: { companyId, createdAt: { gte: periodStart } },
      orderBy: { createdAt: "desc" },
      include: { topic: true },
    }),
  ]);

  const bucketDays = period === "week" ? 1 : 7;
  const sentimentTrend = buildSentimentTrend(currentReviews, periodStart, now, bucketDays);

  const currentTopicMap = buildTopicSentimentMap(currentReviews);
  const previousTopicMap = buildTopicSentimentMap(previousReviews);
  const topics: TopicAnalysis[] = Array.from(currentTopicMap.entries())
    .map(([label, cur]) => {
      const prev = previousTopicMap.get(label);
      const negPctCur = cur.count === 0 ? 0 : (cur.negative / cur.count) * 100;
      const negPctPrev = !prev || prev.count === 0 ? null : (prev.negative / prev.count) * 100;
      const trendDeltaPoints = negPctPrev === null ? 0 : Math.round((negPctCur - negPctPrev) * 10) / 10;
      const trend: TopicAnalysis["trend"] =
        negPctPrev === null ? "flat" : trendDeltaPoints > 5 ? "worse" : trendDeltaPoints < -5 ? "better" : "flat";
      return {
        label,
        count: cur.count,
        positivePercent: cur.count === 0 ? 0 : Math.round((cur.positive / cur.count) * 1000) / 10,
        negativePercent: Math.round(negPctCur * 10) / 10,
        trend,
        trendDeltaPoints,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const channelMap = new Map<Platform, { count: number; ratingSum: number; ratingCount: number; positive: number }>();
  for (const review of currentReviews) {
    const entry = channelMap.get(review.platform) ?? { count: 0, ratingSum: 0, ratingCount: 0, positive: 0 };
    entry.count += 1;
    if (review.rating !== null && review.rating !== undefined) {
      entry.ratingSum += Number(review.rating);
      entry.ratingCount += 1;
    }
    if (effectiveSentiment(review) === "positive") entry.positive += 1;
    channelMap.set(review.platform, entry);
  }
  const channels: ChannelComparison[] = Array.from(channelMap.entries())
    .map(([platform, e]) => ({
      platform,
      count: e.count,
      averageRating: e.ratingCount === 0 ? null : Math.round((e.ratingSum / e.ratingCount) * 10) / 10,
      positivePercent: e.count === 0 ? 0 : Math.round((e.positive / e.count) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  const ratingCounts = [0, 0, 0, 0, 0];
  for (const review of currentReviews) {
    if (review.rating === null || review.rating === undefined) continue;
    const rounded = Math.min(5, Math.max(1, Math.round(Number(review.rating))));
    ratingCounts[rounded - 1] += 1;
  }
  const ratingDistribution: RatingDistributionBucket[] = ratingCounts.map((count, i) => ({ rating: i + 1, count }));

  const aiSolutions: AiSolution[] = alerts.map((alert) => ({
    id: alert.id,
    topicLabel: alert.topic?.label ?? "Onbekend onderwerp",
    priority: alert.priority,
    increasePercentage: Number(alert.increasePercentage),
    reviewCount: alert.reviewCount,
    suggestion: alert.aiSuggestion ?? "Nog geen AI-suggestie beschikbaar voor deze alert.",
    createdAt: alert.createdAt,
    resolved: alert.resolved,
  }));

  return {
    hasReviews: currentReviews.length > 0,
    hasClassifiedData: currentReviews.some((r) => r.feedbackType !== null),
    sentimentTrend,
    topics,
    channels,
    ratingDistribution,
    aiSolutions,
  };
}
