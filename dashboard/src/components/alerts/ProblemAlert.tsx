"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Lightbulb, X } from "lucide-react";
import type { Alert } from "@/lib/types";
import { PriorityBadge } from "@/components/ui/Badge";

export function ProblemAlert({ alert }: { alert: Alert }) {
  const [toastDismissed, setToastDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  return (
    <>
      {!toastDismissed && !modalOpen && (
        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-80 rounded-2xl border border-negative/30 bg-surface-elevated p-4 text-left shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-negative-bg text-negative">
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                Probleem <span className="text-negative">gedetecteerd</span>
              </p>
              <p className="mt-0.5 text-sm font-medium text-negative">{alert.topicLabel}</p>
              <p className="mt-1 text-xs text-muted">
                {alert.increasePercentage}% toename in de afgelopen {alert.windowDays} dagen
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-foreground">
                Klik om details te bekijken <ArrowRight size={12} />
              </span>
            </div>
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                setToastDismissed(true);
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
              aria-label="Sluiten"
            >
              <X size={14} />
            </span>
          </div>
        </button>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-6 shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
              aria-label="Sluiten"
            >
              <X size={16} />
            </button>

            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-negative-bg text-negative">
              <AlertTriangle size={22} />
            </div>

            <h2 className="text-lg font-semibold text-foreground">{alert.topicLabel}</h2>
            <p className="mt-1 text-sm text-muted">
              <span className="font-semibold text-negative">{alert.increasePercentage}% toename</span> in de
              afgelopen {alert.windowDays} dagen vs. vorige {alert.windowDays} dagen ·{" "}
              {alert.reviewCount} reviews
            </p>

            <div className="mt-5 rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Impact</p>
                <PriorityBadge priority={alert.priority} />
              </div>
              <p className="text-sm leading-relaxed text-muted">{alert.impact}</p>
            </div>

            {showSuggestion && (
              <div className="mt-3 rounded-xl border border-solution/30 bg-solution-bg p-4">
                <div className="mb-1.5 flex items-center gap-2 text-solution">
                  <Lightbulb size={16} />
                  <p className="text-sm font-semibold">AI-oplossingssuggestie</p>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">{alert.aiSuggestion}</p>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/feedback"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-95"
              >
                Bekijk probleem <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => setShowSuggestion(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
              >
                <Lightbulb size={14} /> Suggesties bekijken
              </button>
            </div>
            <button
              onClick={() => {
                setModalOpen(false);
                setToastDismissed(true);
              }}
              className="mt-3 w-full text-center text-sm text-muted hover:text-foreground"
            >
              Later bekijken
            </button>
          </div>
        </div>
      )}
    </>
  );
}
