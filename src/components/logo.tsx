// Brand monogram. Uses `currentColor` so it inherits the surrounding text
// color and adapts to light/dark (and accent on hover) with no extra request.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <polygon points="57.78 80 124.44 80 124.44 102.22 102.22 102.22 102.22 146.67 146.67 146.67 146.67 13.33 13.33 13.33 13.33 146.67 80 146.67 80 102.22 57.78 102.22 57.78 124.44 35.56 124.44 35.56 50.06 124.44 35.25 124.44 57.78 57.78 68.89 57.78 80" />
    </svg>
  );
}
