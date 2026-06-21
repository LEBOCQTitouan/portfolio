export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-card border border-accent/25 bg-[var(--accent-soft)] px-4 py-3 text-center">
      <div className="text-2xl font-bold tracking-tight text-accent">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}
