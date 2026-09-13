"use client";

import { useState, useActionState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  generateReviewReplyDraftAction,
  postReviewReplyAction,
  type ReviewReplyActionState,
} from "@/lib/actions/review-reply-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: ReviewReplyActionState = {};

export function ReviewReplyPanel({
  reviewId,
  existingReply,
  onDone,
}: {
  reviewId: string;
  existingReply: string | null;
  onDone: () => void;
}) {
  const [text, setText] = useState(existingReply ?? "");
  const [appliedDraftState, setAppliedDraftState] = useState(initialState);

  const [draftState, draftFormAction, draftPending] = useActionState(generateReviewReplyDraftAction, initialState);
  const [postState, postFormAction] = useActionState(postReviewReplyAction, initialState);

  if (draftState !== appliedDraftState) {
    setAppliedDraftState(draftState);
    if (draftState.draft) setText(draftState.draft);
  }

  return (
    <div className="mt-3 w-full rounded-lg border border-border bg-surface-elevated p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{existingReply ? "Antwoord bewerken" : "Antwoord opstellen"}</p>
        <button
          type="submit"
          form={`draft-form-${reviewId}`}
          disabled={draftPending}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface disabled:opacity-60"
        >
          {draftPending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          AI-antwoord genereren
        </button>
      </div>

      <form id={`draft-form-${reviewId}`} action={draftFormAction}>
        <input type="hidden" name="reviewId" value={reviewId} />
      </form>

      {draftState.error && <p className="mb-2 text-xs text-negative">{draftState.error}</p>}

      <form action={postFormAction} className="space-y-2">
        <input type="hidden" name="reviewId" value={reviewId} />
        <textarea
          name="replyText"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          required
          placeholder="Schrijf je antwoord..."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
        />

        {postState.error && <p className="text-xs text-negative">{postState.error}</p>}
        {postState.success && <p className="text-xs text-positive">{postState.success}</p>}

        <div className="flex items-center gap-2">
          <div className="w-36">
            <SubmitButton>{existingReply ? "Bijwerken" : "Versturen"}</SubmitButton>
          </div>
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:text-foreground"
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  );
}
