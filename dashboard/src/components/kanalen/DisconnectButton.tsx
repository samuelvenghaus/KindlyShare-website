"use client";

import { Unlink } from "lucide-react";
import { disconnectChannelAction } from "@/lib/actions/channel-actions";

export function DisconnectButton({ connectionId }: { connectionId: string }) {
  return (
    <form
      action={disconnectChannelAction}
      onSubmit={(e) => {
        if (!window.confirm("Weet je zeker dat je dit kanaal wilt ontkoppelen?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="connectionId" value={connectionId} />
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-negative/40 hover:text-negative"
      >
        <Unlink size={13} />
        Ontkoppelen
      </button>
    </form>
  );
}
