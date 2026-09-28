"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";

export function DummyCtaButton({
  label,
  confirmMessage,
  variant = "primary",
}: {
  label: string;
  confirmMessage: string;
  variant?: "primary" | "secondary";
}) {
  const [clicked, setClicked] = useState(false);

  if (clicked) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-positive/30 bg-positive-bg px-4 py-2.5 text-sm font-medium text-positive">
        <Check size={16} />
        {confirmMessage}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setClicked(true)}
      className={clsx(
        "w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
        variant === "primary"
          ? "bg-brand text-[#0a0a0a] hover:brightness-95"
          : "border border-border text-foreground hover:bg-surface-elevated"
      )}
    >
      {label}
    </button>
  );
}
