import Link from "next/link";

export function TagPill({ tag }: { tag: string }) {
  return (
    <Link
      href={`/blog/tags/${encodeURIComponent(tag)}`}
      className="rounded-full border border-border px-2 py-0.5 text-xs text-muted transition-colors hover:text-foreground"
    >
      {tag}
    </Link>
  );
}
