export function ProgressBar({ percentage, color = "#ffc72c" }: { percentage: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%`, backgroundColor: color }}
      />
    </div>
  );
}
