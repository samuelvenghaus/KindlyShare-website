"use client";

import { useState } from "react";
import { Flag, MoreHorizontal } from "lucide-react";
import clsx from "clsx";
import type { Review } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { StarRating } from "@/components/ui/StarRating";
import { SentimentBadge, TopicBadge } from "@/components/ui/Badge";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { formatTimeAgo } from "@/lib/dummy-data";

export function ReviewRow({ review, view = "list" }: { review: Review; view?: "list" | "grid" }) {
  const [flagged, setFlagged] = useState(Boolean(review.flagged));

  return (
    <div
      className={clsx(
        "flex gap-4 rounded-xl border border-border bg-surface p-4",
        view === "grid" ? "flex-col" : "flex-col sm:flex-row sm:items-start"
      )}
    >
      <div className="flex items-center gap-3 sm:w-48 sm:shrink-0">
        <div className="relative">
          <Avatar name={review.author} size={38} />
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface">
            <PlatformIcon platform={review.platform} size={14} />
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{review.author}</p>
          <p className="text-xs text-muted">{formatTimeAgo(review.minutesAgo)}</p>
          {review.rating !== null && <StarRating rating={review.rating} />}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{review.text}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {review.topics.map((topic) => (
            <TopicBadge key={topic} label={topic} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:w-auto sm:flex-col sm:items-end">
        <SentimentBadge sentiment={review.sentiment} />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFlagged((v) => !v)}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-lg border",
              flagged
                ? "border-negative/40 bg-negative-bg text-negative"
                : "border-border text-muted hover:text-foreground"
            )}
            aria-label="Markeer review"
          >
            <Flag size={14} />
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground"
            aria-label="Meer opties"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
