import "server-only";
import { prisma } from "@/lib/prisma";
import type { FeedbackType, Platform, Priority, Sentiment } from "@/lib/types";

export type ReportPeriod = "week" | "month" | "quarter";

const PERIOD_DAYS: Record<ReportPeriod, number> = {
  week: 7,
  month: 30,
  quarter: 90,
};

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  week: "Deze week",
  month: "Deze maand",
  quarter: "Dit kwartaal",
};

const DUTCH_MONTHS_SHORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function formatDate(date: Date): string {
  return `${date.getDate()} ${DUTCH_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function changePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function effectiveSentiment(review: { sentiment: Sentiment | null; rating: unknown }): Sentiment | null {
  if (review.sentiment) return review.sentiment;
  const rating = review.rating !== null && review.rating !== undefined ? Number(review.rating) : null;
  if (rating === null) return null;
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

export interface ReportAlert {
  id: string;
  topicLabel: string;
  priority: Priority;
  increasePercentage: number;
  createdAt: Date;
  resolved: boolean;
}

export interface ReportData {
  period: ReportPeriod;
  dateRangeLabel: string;
  hasReviews: boolean;
  totalReviews: { value: number; changePercent: number };
  averageRating: number | null;
  ignoredNoiseCount: number;
  sentimentBreakdown: { sentiment: Sentiment; count: number; percentage: number }[];
  feedbackTypeBreakdown: { type: FeedbackType; count: number }[];
  topTopics: { label: string; count: number }[];
  channelBreakdown: { platform: Platform; count: number; percentage: number }[];
  alerts: ReportAlert[];
}

export async function getReportData(companyId: string, period: ReportPeriod): Promise<ReportData> {
  const days = PERIOD_DAYS[period];
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

  const [currentReviews, previousReviewCount, topicLinks, channelCounts, alerts, ignoredNoiseCount] =
    await Promise.all([
      prisma.review.findMany({
        where: { companyId, postedAt: { gte: periodStart }, isRelevant: true },
        select: { sentiment: true, rating: true, feedbackType: true, platform: true },
      }),
      prisma.review.count({
        where: { companyId, postedAt: { gte: previousPeriodStart, lt: periodStart }, isRelevant: true },
      }),
      prisma.reviewTopic.findMany({
        where: { review: { companyId, postedAt: { gte: periodStart }, isRelevant: true } },
        select: { topic: { select: { label: true } } },
      }),
      prisma.review.groupBy({
        by: ["platform"],
        where: { companyId, postedAt: { gte: periodStart }, isRelevant: true },
        _count: { _all: true },
      }),
      prisma.alert.findMany({
        where: { companyId, createdAt: { gte: periodStart } },
        orderBy: { createdAt: "desc" },
        include: { topic: true },
      }),
      prisma.review.count({
        where: { companyId, postedAt: { gte: periodStart }, isRelevant: false },
      }),
    ]);

  const total = currentReviews.length;

  const sentimentCounts: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0 };
  for (const review of currentReviews) {
    const sentiment = effectiveSentiment(review);
    if (sentiment) sentimentCounts[sentiment] += 1;
  }
  const sentimentBreakdown = (["positive", "neutral", "negative"] as Sentiment[]).map((sentiment) => ({
    sentiment,
    count: sentimentCounts[sentiment],
    percentage: total === 0 ? 0 : Math.round((sentimentCounts[sentiment] / total) * 1000) / 10,
  }));

  const feedbackTypeCounts: Record<FeedbackType, number> = { praise: 0, interest: 0, problem: 0, solution: 0 };
  for (const review of currentReviews) {
    if (review.feedbackType) feedbackTypeCounts[review.feedbackType] += 1;
  }
  const feedbackTypeBreakdown = (["praise", "interest", "problem", "solution"] as FeedbackType[]).map((type) => ({
    type,
    count: feedbackTypeCounts[type],
  }));

  const topicCounts = new Map<string, number>();
  for (const link of topicLinks) {
    const label = link.topic.label;
    topicCounts.set(label, (topicCounts.get(label) ?? 0) + 1);
  }
  const topTopics = Array.from(topicCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const channelBreakdown = channelCounts
    .map((c) => ({
      platform: c.platform as Platform,
      count: c._count._all,
      percentage: total === 0 ? 0 : Math.round((c._count._all / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  const ratings = currentReviews
    .filter((r) => r.rating !== null && r.rating !== undefined)
    .map((r) => Number(r.rating));
  const averageRating = ratings.length === 0 ? null : Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;

  return {
    period,
    dateRangeLabel: `${formatDate(periodStart)} - ${formatDate(now)}`,
    hasReviews: total > 0,
    totalReviews: { value: total, changePercent: changePercent(total, previousReviewCount) },
    averageRating,
    ignoredNoiseCount,
    sentimentBreakdown,
    feedbackTypeBreakdown,
    topTopics,
    channelBreakdown,
    alerts: alerts.map((alert) => ({
      id: alert.id,
      topicLabel: alert.topic?.label ?? "Onbekend onderwerp",
      priority: alert.priority,
      increasePercentage: Number(alert.increasePercentage),
      createdAt: alert.createdAt,
      resolved: alert.resolved,
    })),
  };
}
