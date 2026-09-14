import "server-only";
import { prisma } from "@/lib/prisma";
import type { Alert as UiAlert, NoteItem, Priority } from "@/lib/types";

function buildImpactText(topicLabel: string, increasePercentage: number, windowDays: number): string {
  return (
    `Het onderwerp "${topicLabel}" komt ${increasePercentage}% vaker voor in problem-feedback dan in de ` +
    `${windowDays} dagen daarvoor. Dit kan wijzen op een opkomend probleem dat aandacht verdient.`
  );
}

export async function getLatestUnresolvedAlert(companyId: string): Promise<UiAlert | null> {
  const alert = await prisma.alert.findFirst({
    where: { companyId, resolved: false },
    orderBy: { createdAt: "desc" },
    include: { topic: true },
  });
  if (!alert) return null;

  const topicLabel = alert.topic?.label ?? "Onbekend onderwerp";
  const increasePercentage = Number(alert.increasePercentage);

  return {
    id: alert.id,
    topicLabel,
    increasePercentage,
    windowDays: alert.timeWindowDays,
    priority: alert.priority,
    reviewCount: alert.reviewCount,
    impact: buildImpactText(topicLabel, increasePercentage, alert.timeWindowDays),
    aiSuggestion: alert.aiSuggestion ?? "Er is nog geen AI-suggestie beschikbaar voor deze alert.",
  };
}

export async function getUnresolvedAlertCount(companyId: string): Promise<number> {
  return prisma.alert.count({ where: { companyId, resolved: false } });
}

export interface AlertListItem {
  id: string;
  topicLabel: string;
  increasePercentage: number;
  windowDays: number;
  priority: Priority;
  reviewCount: number;
  resolved: boolean;
  createdAt: Date;
  aiSuggestion: string | null;
  assignedToId: string | null;
  notes: NoteItem[];
}

export async function listAlerts(companyId: string): Promise<AlertListItem[]> {
  const alerts = await prisma.alert.findMany({
    where: { companyId },
    orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
    include: { topic: true, notes: { include: { author: true }, orderBy: { createdAt: "asc" } } },
  });

  const now = Date.now();
  return alerts.map((alert) => ({
    id: alert.id,
    topicLabel: alert.topic?.label ?? "Onbekend onderwerp",
    increasePercentage: Number(alert.increasePercentage),
    windowDays: alert.timeWindowDays,
    priority: alert.priority,
    reviewCount: alert.reviewCount,
    resolved: alert.resolved,
    createdAt: alert.createdAt,
    aiSuggestion: alert.aiSuggestion,
    assignedToId: alert.assignedToId,
    notes: alert.notes.map((note) => ({
      id: note.id,
      authorName: note.author?.name ?? "Verwijderde gebruiker",
      text: note.text,
      minutesAgo: Math.max(0, Math.round((now - note.createdAt.getTime()) / 60000)),
    })),
  }));
}
