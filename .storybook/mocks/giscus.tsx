import * as React from "react";

// Stand-in for @giscus/react inside Storybook. The real widget injects a
// <script> and renders an iframe from giscus.app, which needs a configured
// repository and network access. This placeholder keeps the <Comments> story
// self-contained while still reflecting the theme prop.
type GiscusProps = {
  theme?: string;
  [key: string]: unknown;
};

export default function Giscus({ theme }: GiscusProps) {
  return (
    <div
      style={{
        border: "1px dashed var(--border)",
        borderRadius: 12,
        padding: "1.5rem",
        textAlign: "center",
        color: "var(--muted)",
        fontSize: 14,
      }}
    >
      💬 giscus comments (mocked) — theme: <strong>{theme}</strong>
      <div style={{ marginTop: 6, fontSize: 12 }}>
        The real widget loads from giscus.app in production.
      </div>
    </div>
  );
}
