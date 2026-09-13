"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import clsx from "clsx";
import { submitFeedbackFormAction, type FeedbackFormState } from "@/lib/actions/public-feedback-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: FeedbackFormState = {};

export function FeedbackForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(submitFeedbackFormAction, initialState);
  const [rating, setRating] = useState(0);

  if (state.success) {
    return (
      <div className="py-4 text-center">
        <p className="text-base font-semibold text-foreground">Bedankt voor je feedback!</p>
        <p className="mt-1 text-sm text-muted">Je antwoord is goed ontvangen.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="rating" value={rating || ""} />

      <div>
        <span className="mb-2 block text-sm font-medium text-foreground">Hoe zou je je ervaring beoordelen?</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`${star} sterren`}
              className="p-0.5"
            >
              <Star
                size={32}
                className={clsx(star <= rating ? "fill-solution text-solution" : "fill-transparent text-border")}
              />
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Vertel ons meer (optioneel)</span>
        <textarea
          name="text"
          rows={4}
          placeholder="Wat vond je goed, en wat kan er beter?"
          className="w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
        />
      </label>

      {state.error && <p className="text-sm text-negative">{state.error}</p>}

      <SubmitButton>Feedback versturen</SubmitButton>
    </form>
  );
}
