export function SetupSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-3 space-y-2.5">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-2.5 text-xs text-muted">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-[11px] font-semibold text-foreground">
            {i + 1}
          </span>
          <span className="pt-px">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function SetupNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 rounded-lg border border-solution/30 bg-solution-bg px-3 py-2.5 text-xs text-solution">
      {children}
    </p>
  );
}
