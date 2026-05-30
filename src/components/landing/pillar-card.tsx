import Link from "next/link";

export function PillarCard({
  label,
  description,
  href,
}: {
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-card p-5 transition hover:border-accent/50"
    >
      <span className="block font-semibold tracking-tight">{label}</span>
      <span className="mt-1 block text-sm text-muted">{description}</span>
      <span className="mt-3 inline-block text-sm text-accent opacity-0 transition group-hover:opacity-100">
        Explore →
      </span>
    </Link>
  );
}
