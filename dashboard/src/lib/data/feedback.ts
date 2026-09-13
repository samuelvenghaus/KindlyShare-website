import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { canReplyToReview } from "@/lib/reviews/reply";
import type { FeedbackType, Platform, Sentiment, TrendPoint } from "@/lib/types";

export const FEEDBACK_PAGE_SIZE = 10;
const TREND_WEEKS = 12;
const DUTCH_MONTHS_SHORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

const ALL_PLATFORMS: Platform[] = ["google", "trustpilot", "app_store", "instagram", "facebook", "tiktok", "overig", "email_campaign", "widget"];

export type FeedbackTab = Platform | "all";
export type SentimentFilter = "all" | Sentiment;
export type ScoreFilter = "all" | number;
export type SortOrder = "newest" | "oldest";

export interface FeedbackFilters {
  tab: FeedbackTab;
  q: string;
  sentiment: SentimentFilter;
  score: ScoreFilter;
  category: string;
  sort: SortOrder;
  page: number;
}

export interface FeedbackReviewItem {
  id: string;
  platform: Platform;
  author: string;
  rating: number | null;
  text: string;
  sentiment: Sentiment;
  feedbackType: FeedbackType | null;
  topics: string[];
  minutesAgo: number;
  canReply: boolean;
  replyText: string | null;
  repliedAt: number | null;
}

export interface FeedbackPlatformPanel {
  totalReviews: number;
  sentimentPercent: { positive: number; negative: number; neutral: number };
  sentimentCounts: { positive: number; negative: number; neutral: number };
  trend: TrendPoint[];
  scoreDistribution: { stars: number; count: number; percentage: number }[];
  topTopics: { label: string; percentage: number }[];
}

export interface FeedbackData {
  tabCounts: { platform: FeedbackTab; count: number }[];
  categoryOptions: string[];
  totalCount: number;
  reviews: FeedbackReviewItem[];
  platformPanel: FeedbackPlatformPanel | null;
}

function effectiveSentiment(review: { sentiment: Sentiment | null; rating: unknown }): Sentiment {
  if (review.sentiment) return review.sentiment;
  const rating = review.rating !== null && review.rating !== undefined ? Number(review.rating) : null;
  if (rating === null) return "neutral";
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

function formatWeekLabel(date: Date): string {
  return `${date.getDate()} ${DUTCH_MONTHS_SHORT[date.getMonth()]}`;
}

function buildTrend(reviews: { postedAt: Date | null; sentiment: Sentiment | null; rating: unknown }[]): TrendPoint[] {
  const now = new Date();
  const periodStart = new Date(now.getTime() - TREND_WEEKS * 7 * 24 * 60 * 60 * 1000);
  const buckets: { date: string; start: Date; end: Date; positive: number; negative: number; neutral: number }[] = [];
  let cursor = new Date(periodStart);
  while (cursor < now) {
    const end = new Date(Math.min(cursor.getTime() + 7 * 24 * 60 * 60 * 1000, now.getTime() + 1));
    buckets.push({ date: formatWeekLabel(cursor), start: new Date(cursor), end, positive: 0, negative: 0, neutral: 0 });
    cursor = end;
  }
  for (const review of reviews) {
    if (!review.postedAt || review.postedAt < periodStart) continue;
    const sentiment = effectiveSentiment(review);
    const bucket = buckets.find((b) => review.postedAt! >= b.start && review.postedAt! < b.end);
    if (bucket) bucket[sentiment] += 1;
  }
  return buckets.map(({ date, positive, negative, neutral }) => ({ date, positive, negative, neutral }));
}

export async function getFeedbackData(companyId: string, filters: FeedbackFilters): Promise<FeedbackData> {
  const { tab, q, sentiment, score, category, sort, page } = filters;

  const platformCounts = await prisma.review.groupBy({
    by: ["platform"],
    where: { companyId, isRelevant: true },
    _count: { _all: true },
  });
  const totalAll = platformCounts.reduce((s, c) => s + c._count._all, 0);
  const tabCounts: { platform: FeedbackTab; count: number }[] = [
    { platform: "all", count: totalAll },
    ...ALL_PLATFORMS.filter((p) => platformCounts.some((c) => c.platform === p)).map((p) => ({
      platform: p,
      count: platformCounts.find((c) => c.platform === p)?._count._all ?? 0,
    })),
  ];

  const platformScope: Prisma.ReviewWhereInput = { companyId, isRelevant: true, ...(tab !== "all" ? { platform: tab } : {}) };

  const distinctTopicLinks = await prisma.reviewTopic.findMany({
    where: { review: platformScope },
    select: { topic: { select: { label: true } } },
    distinct: ["topicId"],
  });
  const categoryOptions = Array.from(new Set(distinctTopicLinks.map((t) => t.topic.label))).sort();

  const where: Prisma.ReviewWhereInput = {
    ...platformScope,
    ...(sentiment !== "all" ? { sentiment } : {}),
    ...(score !== "all" ? { rating: { gte: score - 0.5, lt: score + 0.5 } } : {}),
    ...(category !== "all" ? { topics: { some: { topic: { label: category } } } } : {}),
    ...(q
      ? {
          OR: [
            { text: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { author: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const [totalCount, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { postedAt: sort === "oldest" ? "asc" : "desc" },
      skip: (page - 1) * FEEDBACK_PAGE_SIZE,
      take: FEEDBACK_PAGE_SIZE,
      include: { topics: { include: { topic: true } } },
    }),
  ]);

  const now = Date.now();
  const reviews: FeedbackReviewItem[] = rows.map((review) => {
    const timestamp = review.postedAt ?? review.fetchedAt;
    return {
      id: review.id,
      platform: review.platform as Platform,
      author: review.author ?? "Anonieme gebruiker",
      rating: review.rating !== null ? Number(review.rating) : null,
      text: review.text ?? "(Geen tekst)",
      sentiment: effectiveSentiment(review),
      feedbackType: review.feedbackType,
      topics: review.topics.map((t) => t.topic.label),
      minutesAgo: Math.max(0, Math.round((now - timestamp.getTime()) / 60000)),
      canReply: canReplyToReview(review.platform as Platform),
      replyText: review.replyText,
      repliedAt: review.repliedAt ? Math.max(0, Math.round((now - review.repliedAt.getTime()) / 60000)) : null,
    };
  });

  let platformPanel: FeedbackPlatformPanel | null = null;
  if (tab !== "all") {
    const platformReviews = await prisma.review.findMany({
      where: platformScope,
      select: { sentiment: true, rating: true, postedAt: true },
    });
    const total = platformReviews.length;
    const countBySentiment = (target: Sentiment) => platformReviews.filter((r) => effectiveSentiment(r) === target).length;
    const positive = countBySentiment("positive");
    const negative = countBySentiment("negative");
    const neutral = countBySentiment("neutral");

    const ratingCounts = [0, 0, 0, 0, 0];
    for (const r of platformReviews) {
      if (r.rating === null || r.rating === undefined) continue;
      const rounded = Math.min(5, Math.max(1, Math.round(Number(r.rating))));
      ratingCounts[rounded - 1] += 1;
    }
    const ratedTotal = ratingCounts.reduce((s, c) => s + c, 0);
    const scoreDistribution = ratingCounts
      .map((count, i) => ({ stars: i + 1, count, percentage: ratedTotal === 0 ? 0 : Math.round((count / ratedTotal) * 1000) / 10 }))
      .reverse();

    const allTopicLinks = await prisma.reviewTopic.findMany({
      where: { review: platformScope },
      select: { topic: { select: { label: true } } },
    });
    const platformTopicCounts = new Map<string, number>();
    for (const link of allTopicLinks) {
      platformTopicCounts.set(link.topic.label, (platformTopicCounts.get(link.topic.label) ?? 0) + 1);
    }
    const topicTotal = Array.from(platformTopicCounts.values()).reduce((s, c) => s + c, 0);
    const topTopics = Array.from(platformTopicCounts.entries())
      .map(([label, count]) => ({ label, percentage: topicTotal === 0 ? 0 : Math.round((count / topicTotal) * 1000) / 10 }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    platformPanel = {
      totalReviews: total,
      sentimentPercent: {
        positive: total === 0 ? 0 : Math.round((positive / total) * 1000) / 10,
        negative: total === 0 ? 0 : Math.round((negative / total) * 1000) / 10,
        neutral: total === 0 ? 0 : Math.round((neutral / total) * 1000) / 10,
      },
      sentimentCounts: { positive, negative, neutral },
      trend: buildTrend(platformReviews),
      scoreDistribution,
      topTopics,
    };
  }

  return { tabCounts, categoryOptions, totalCount, reviews, platformPanel };
}
