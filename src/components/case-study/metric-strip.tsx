import { Metric } from "./metric";

export function MetricStrip({
  metrics,
}: {
  metrics: { value: string; label: string }[];
}) {
  if (metrics.length === 0) return null;
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {metrics.map((m) => (
        <Metric key={m.label} value={m.value} label={m.label} />
      ))}
    </div>
  );
}
