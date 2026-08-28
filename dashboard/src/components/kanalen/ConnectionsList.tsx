import { Circle } from "lucide-react";
import { ChannelSyncButton } from "@/components/kanalen/ChannelSyncButton";
import { DisconnectButton } from "@/components/kanalen/DisconnectButton";
import { formatTimeAgo, minutesSince } from "@/lib/dummy-data";

export interface ConnectionSummary {
  id: string;
  externalAccountId: string | null;
  lastSyncedAt: Date | null;
}

export function ConnectionsList({ connections }: { connections: ConnectionSummary[] }) {
  return (
    <div className="space-y-4">
      {connections.map((connection) => (
        <div key={connection.id} className="rounded-xl border border-border bg-surface-elevated p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Circle size={8} className="fill-positive text-positive" />
                Actief
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{connection.externalAccountId}</p>
              <p className="mt-1 text-xs text-muted">
                {connection.lastSyncedAt
                  ? `Laatst gesynchroniseerd: ${formatTimeAgo(minutesSince(connection.lastSyncedAt))}`
                  : "Nog niet gesynchroniseerd"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ChannelSyncButton connectionId={connection.id} />
            <DisconnectButton connectionId={connection.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
