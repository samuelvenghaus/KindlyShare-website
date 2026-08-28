import "server-only";
import { prisma } from "@/lib/prisma";
import { generateAlertSuggestion } from "./suggestions";
import type { Alert, Topic } from "@/generated/prisma/client";

export type AlertWithTopic = Alert & { topic: Topic | null };

// Vaste alert-drempel (zoals afgesproken voor deze fase, later instelbaar per bedrijf).
const WINDOW_DAYS = 3;
const INCREASE_THRESHOLD_PERCENT = 30;
const MIN_CURRENT_REVIEWS = 3;

function increasePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function checkAlertThresholds(companyId: string): Promise<AlertWithTopic[]> {
  const topics = await prisma.topic.findMany({ where: { companyId } });
  if (topics.length === 0) return [];

  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const previousWindowStart = new Date(windowStart.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const newAlerts: AlertWithTopic[] = [];

  for (const topic of topics) {
    const existingUnresolved = await prisma.alert.findFirst({
      where: { companyId, topicId: topic.id, resolved: false },
    });
    if (existingUnresolved) continue;

    const [currentCount, previousCount] = await Promise.all([
      prisma.review.count({
        where: {
          companyId,
          feedbackType: "problem",
          postedAt: { gte: windowStart },
          topics: { some: { topicId: topic.id } },
        },
      }),
      prisma.review.count({
        where: {
          companyId,
          feedbackType: "problem",
          postedAt: { gte: previousWindowStart, lt: windowStart },
          topics: { some: { topicId: topic.id } },
        },
      }),
    ]);

    if (currentCount < MIN_CURRENT_REVIEWS) continue;

    const pct = increasePercent(currentCount, previousCount);
    if (pct < INCREASE_THRESHOLD_PERCENT) continue;

    const exampleReviews = await prisma.review.findMany({
      where: {
        companyId,
        feedbackType: "problem",
        postedAt: { gte: windowStart },
        topics: { some: { topicId: topic.id } },
      },
      orderBy: { postedAt: "desc" },
      take: 3,
      select: { text: true },
    });

    const priority = pct >= 60 ? "high" : "medium";
    const aiSuggestion = await generateAlertSuggestion({
      topicLabel: topic.label,
      increasePercentage: pct,
      windowDays: WINDOW_DAYS,
      exampleTexts: exampleReviews.map((r) => r.text).filter((t): t is string => Boolean(t)),
    });

    const alert = await prisma.alert.create({
      data: {
        companyId,
        topicId: topic.id,
        reviewCount: currentCount,
        timeWindowDays: WINDOW_DAYS,
        increasePercentage: pct,
        priority,
        aiSuggestion,
      },
      include: { topic: true },
    });

    newAlerts.push(alert);
  }

  return newAlerts;
}
