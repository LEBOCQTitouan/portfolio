"use client";

import { useState } from "react";
import { SUBJECTS, type SubjectId } from "@/design/tokens";

const LABELS: Record<SubjectId, string> = {
  brand: "Brand",
  systems: "Systems",
  interface: "Interface",
  ai: "AI",
};

export function SubjectSwitcher({ lead, accent, primaryAction }: { lead: string; accent: string; primaryAction: string }) {
  const [subject, setSubject] = useState<SubjectId>("brand");

  return (
    <div>
      <div role="group" aria-label="Subject" className="flex flex-wrap gap-2">
        {SUBJECTS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubject(id)}
            aria-pressed={subject === id}
            className="rounded-full border px-3 py-1 text-sm font-medium transition-colors"
            style={
              subject === id
                ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" }
                : { borderColor: "var(--border)", color: "var(--muted)" }
            }
          >
            {LABELS[id]}
          </button>
        ))}
      </div>

      <div
        data-ds-preview
        data-subject={subject}
        className="mt-6 overflow-hidden rounded-2xl border border-border p-8"
        style={{
          background:
            "radial-gradient(120% 90% at 85% -10%, var(--accent-soft), transparent 55%), var(--surface)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest accent-text">
          {LABELS[subject]}
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight">
          {lead} <span className="accent-text">{accent}</span>.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="accent-fill rounded-lg px-4 py-2 text-sm font-semibold">{primaryAction}</span>
          <span
            className="rounded-full border px-3 py-1 text-xs font-medium"
            style={{ background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" }}
          >
            {LABELS[subject]}
          </span>
        </div>
      </div>
    </div>
  );
}
