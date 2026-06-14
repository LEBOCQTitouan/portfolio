import { SUBJECTS, TOKENS, gradientCss } from "@/design/tokens";

export function TokenReference() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {SUBJECTS.map((id) => {
        const t = TOKENS[id];
        const swatch = gradientCss(id);
        return (
          <li key={id} className="flex items-center gap-3 rounded-xl border border-border p-4">
            <span
              aria-hidden="true"
              className="h-10 w-10 shrink-0 rounded-lg"
              style={{ background: swatch }}
            />
            <div className="min-w-0">
              <p className="font-semibold capitalize">{id}</p>
              <p className="font-mono text-xs text-muted">
                light {t.accent.light} · dark {t.accent.dark}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
