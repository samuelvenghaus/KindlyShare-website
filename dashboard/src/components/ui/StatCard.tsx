import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { Card } from "./Card";

export function StatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  changePercent,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  value: string;
  changePercent: number;
}) {
  const positive = changePercent >= 0;
  return (
    <Card>
      <div
        className={clsx(
          "mb-4 flex h-10 w-10 items-center justify-center rounded-xl",
          iconClassName ?? "bg-interest-bg text-interest"
        )}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span
          className={clsx(
            "text-sm font-medium",
            positive ? "text-positive" : "text-negative"
          )}
        >
          {positive ? "↑" : "↓"} {Math.abs(changePercent)}%
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">vs vorige periode</p>
    </Card>
  );
}
