"use client";

import { useState } from "react";
import { Flag, MoreHorizontal, Reply } from "lucide-react";
import clsx from "clsx";
import type { Review } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { StarRating } from "@/components/ui/StarRating";
import { SentimentBadge, TopicBadge } from "@/components/ui/Badge";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { ReviewReplyPanel } from "@/components/feedback/ReviewReplyPanel";
import { AssigneeSelect } from "@/components/ui/AssigneeSelect";
import { NotesSection } from "@/components/ui/NotesSection";
import { assignReviewAction } from "@/lib/actions/assignment-actions";
import { addReviewNoteAction } from "@/lib/actions/note-actions";
import { formatTimeAgo } from "@/lib/dummy-data";

export function ReviewRow({
  review,
  view = "list",
  teamMembers,
}: {
  review: Review;
  view?: "list" | "grid";
  teamMembers: { id: string; name: string }[];
}) {
  const [flagged, setFlagged] = useState(Boolean(review.flagged));
  const [replyOpen, setReplyOpen] = useState(false);

  return (
    <div
      className={clsx(
        "flex flex-wrap gap-4 rounded-xl border border-border bg-surface p-4",
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

        {review.replyText && !replyOpen && (
          <div className="mt-3 rounded-lg border border-border bg-surface-elevated p-3">
            <p className="text-xs font-medium text-muted">
              Jouw antwoord {review.repliedAt !== null ? `· ${formatTimeAgo(review.repliedAt)}` : ""}
            </p>
            <p className="mt-1 text-sm text-foreground">{review.replyText}</p>
          </div>
        )}

        {replyOpen && (
          <ReviewReplyPanel reviewId={review.id} existingReply={review.replyText} onDone={() => setReplyOpen(false)} />
        )}

        <NotesSection
          notes={review.notes}
          hiddenFieldName="reviewId"
          hiddenFieldValue={review.id}
          action={addReviewNoteAction}
        />
      </div>

      <div className="flex items-center gap-2 sm:w-auto sm:flex-col sm:items-end">
        <SentimentBadge sentiment={review.sentiment} />
        <AssigneeSelect
          hiddenFieldName="reviewId"
          hiddenFieldValue={review.id}
          assignedToId={review.assignedToId}
          teamMembers={teamMembers}
          action={assignReviewAction}
        />
        <div className="flex items-center gap-1">
          {review.canReply && (
            <button
              onClick={() => setReplyOpen((v) => !v)}
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-lg border",
                replyOpen
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border text-muted hover:text-foreground"
              )}
              aria-label={review.replyText ? "Antwoord bewerken" : "Reageren"}
            >
              <Reply size={14} />
            </button>
          )}
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
