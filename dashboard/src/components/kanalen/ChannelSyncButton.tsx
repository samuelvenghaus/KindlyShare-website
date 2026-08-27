"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { syncChannelAction, type SyncActionState } from "@/lib/actions/channel-actions";

const initialState: SyncActionState = {};

export function ChannelSyncButton({ connectionId }: { connectionId: string }) {
  const [state, formAction, pending] = useActionState(syncChannelAction, initialState);

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="connectionId" value={connectionId} />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface disabled:opacity-60"
        >
          <RefreshCw size={13} className={pending ? "animate-spin" : ""} />
          {pending ? "Synchroniseren..." : "Nu synchroniseren"}
        </button>
      </form>
      {state.success && <p className="mt-1.5 text-xs text-positive">{state.success}</p>}
      {state.error && <p className="mt-1.5 text-xs text-negative">{state.error}</p>}
    </div>
  );
}
