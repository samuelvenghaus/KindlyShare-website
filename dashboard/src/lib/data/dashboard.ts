import "server-only";
import { prisma } from "@/lib/prisma";
import type { FeedbackType, Platform, Sentiment } from "@/lib/types";

const PERIOD_DAYS = 30;
const DUTCH_MONTHS_SHORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export interface DashboardKpi {
  value: number;
  changePercent: number;
}

export interface DashboardData {
  hasConnections: boolean;
  hasReviews: boolean;
  hasClassifiedData: boolean;
  totalFeedback: DashboardKpi;
  positiveFeedback: DashboardKpi;
  problems: DashboardKpi;
  solutions: DashboardKpi;
  feedbackTypeBreakdown: { type: FeedbackType; count: number }[];
  topTopics: { label: string; count: number }[];
  channels: { platform: Platform; count: number; percentage: number }[];
  recentReviews: {
    id: string;
    platform: Platform;
    author: string | null;
    text: string | null;
    sentiment: Sentiment | null;
    feedbackType: FeedbackType | null;
    minutesAgo: number;
  }[];
  trend: { date: string; value: number }[];
}

/**
 * Zolang Fase 4 (AI-classificatie) er nog niet is, gebruiken we de sterrenscore
 * als grove sentiment-inschatting voor reviews die nog niet geclassificeerd zijn.
 */
function effectiveSentiment(review: { sentiment: Sentiment | null; rating: unknown }): Sentiment | null {
  if (review.sentiment) return review.sentiment;
  const rating = review.rating !== null && review.rating !== undefined ? Number(review.rating) : null;
  if (rating === null) return null;
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

function changePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function formatDayLabel(date: Date): string {
  return `${date.getDate()} ${DUTCH_MONTHS_SHORT[date.getMonth()]}`;
}

export async function getDashboardData(companyId: string): Promise<DashboardData> {
  const now = new Date();
  const periodStart = new Date(now.getTime() - PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(periodStart.getTime() - PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const [
    connectionCount,
    totalReviewCount,
    currentPeriodReviews,
    previousPeriodReviews,
    channelCounts,
    recent,
    periodTopicLinks,
  ] = await Promise.all([
    prisma.platformConnection.count({ where: { companyId } }),
    prisma.review.count({ where: { companyId, isRelevant: true } }),
    prisma.review.findMany({
      where: { companyId, postedAt: { gte: periodStart }, isRelevant: true },
      select: { sentiment: true, rating: true, postedAt: true, feedbackType: true },
    }),
    prisma.review.findMany({
      where: { companyId, postedAt: { gte: previousPeriodStart, lt: periodStart }, isRelevant: true },
      select: { sentiment: true, rating: true, feedbackType: true },
    }),
    prisma.review.groupBy({ by: ["platform"], where: { companyId, isRelevant: true }, _count: { _all: true } }),
    prisma.review.findMany({
      where: { companyId, isRelevant: true },
      orderBy: [{ postedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        platform: true,
        author: true,
        text: true,
        sentiment: true,
        rating: true,
        postedAt: true,
        fetchedAt: true,
        feedbackType: true,
      },
    }),
    prisma.reviewTopic.findMany({
      where: { review: { companyId, postedAt: { gte: periodStart }, isRelevant: true } },
      select: { topic: { select: { label: true } } },
    }),
  ]);

  const countBySentiment = (reviews: { sentiment: Sentiment | null; rating: unknown }[], target: Sentiment) =>
    reviews.filter((r) => effectiveSentiment(r) === target).length;

  const currentPositive = countBySentiment(currentPeriodReviews, "positive");
  const previousPositive = countBySentiment(previousPeriodReviews, "positive");
  const currentNegative = countBySentiment(currentPeriodReviews, "negative");
  const previousNegative = countBySentiment(previousPeriodReviews, "negative");

  const countByFeedbackType = (reviews: { feedbackType: FeedbackType | null }[], type: FeedbackType) =>
    reviews.filter((r) => r.feedbackType === type).length;

  const currentSolutions = countByFeedbackType(currentPeriodReviews, "solution");
  const previousSolutions = countByFeedbackType(previousPeriodReviews, "solution");

  const hasClassifiedData = currentPeriodReviews.some((r) => r.feedbackType !== null);

  const feedbackTypeBreakdown: { type: FeedbackType; count: number }[] = (
    ["praise", "interest", "problem", "solution"] as FeedbackType[]
  ).map((type) => ({ type, count: countByFeedbackType(currentPeriodReviews, type) }));

  const topicCounts = new Map<string, number>();
  for (const link of periodTopicLinks) {
    const label = link.topic.label;
    topicCounts.set(label, (topicCounts.get(label) ?? 0) + 1);
  }
  const topTopics = Array.from(topicCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const channels = channelCounts
    .map((c) => ({
      platform: c.platform as Platform,
      count: c._count._all,
      percentage: totalReviewCount === 0 ? 0 : Math.round((c._count._all / totalReviewCount) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  const recentReviews = recent.map((review) => {
    const timestamp = review.postedAt ?? review.fetchedAt;
    return {
      id: review.id,
      platform: review.platform as Platform,
      author: review.author,
      text: review.text,
      sentiment: effectiveSentiment(review),
      feedbackType: review.feedbackType,
      minutesAgo: Math.max(0, Math.round((now.getTime() - timestamp.getTime()) / 60000)),
    };
  });

  const trendBuckets = new Map<string, number>();
  for (let i = PERIOD_DAYS - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    trendBuckets.set(formatDayLabel(day), 0);
  }
  for (const review of currentPeriodReviews) {
    if (!review.postedAt) continue;
    if (effectiveSentiment(review) !== "positive") continue;
    const label = formatDayLabel(review.postedAt);
    if (trendBuckets.has(label)) {
      trendBuckets.set(label, (trendBuckets.get(label) ?? 0) + 1);
    }
  }
  const trend = Array.from(trendBuckets.entries()).map(([date, value]) => ({ date, value }));

  return {
    hasConnections: connectionCount > 0,
    hasReviews: totalReviewCount > 0,
    hasClassifiedData,
    totalFeedback: {
      value: currentPeriodReviews.length,
      changePercent: changePercent(currentPeriodReviews.length, previousPeriodReviews.length),
    },
    positiveFeedback: { value: currentPositive, changePercent: changePercent(currentPositive, previousPositive) },
    problems: { value: currentNegative, changePercent: changePercent(currentNegative, previousNegative) },
    solutions: { value: currentSolutions, changePercent: changePercent(currentSolutions, previousSolutions) },
    feedbackTypeBreakdown,
    topTopics,
    channels,
    recentReviews,
    trend,
  };
}
