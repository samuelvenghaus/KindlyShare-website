import clsx from "clsx";
import { Smile, Meh, Frown } from "lucide-react";
import type { Sentiment } from "@/lib/types";
import { SENTIMENT_LABELS } from "@/lib/dummy-data";

const sentimentStyles: Record<Sentiment, string> = {
  positive: "bg-positive-bg text-positive",
  negative: "bg-negative-bg text-negative",
  neutral: "bg-neutral-bg text-neutral",
};

const sentimentIcons: Record<Sentiment, typeof Smile> = {
  positive: Smile,
  negative: Frown,
  neutral: Meh,
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const Icon = sentimentIcons[sentiment];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        sentimentStyles[sentiment]
      )}
    >
      <Icon size={14} />
      {SENTIMENT_LABELS[sentiment]}
    </span>
  );
}

export function TopicBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium text-muted">
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" }) {
  const labels = { low: "Lage prioriteit", medium: "Gemiddelde prioriteit", high: "Hoge prioriteit" };
  const styles = {
    low: "bg-neutral-bg text-neutral",
    medium: "bg-solution-bg text-solution",
    high: "bg-negative-bg text-negative",
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", styles[priority])}>
      {labels[priority]}
    </span>
  );
}
