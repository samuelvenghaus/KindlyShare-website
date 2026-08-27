"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-95 disabled:opacity-60"
    >
      {pending && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}
