import Link from "next/link";
import { cn, cardClass } from "@/components/ui/styles";

export function PillarCard({
  label,
  description,
  href,
  subject = "brand",
}: {
  label: string;
  description: string;
  href: string;
  subject?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group", cardClass())}
      data-bp-attract
      data-subject={subject}
    >
      <span className="block font-semibold tracking-tight">{label}</span>
      <span className="mt-1 block text-sm text-muted">{description}</span>
      <span className="mt-3 inline-block text-sm text-accent opacity-0 transition group-hover:opacity-100">
        Explore →
      </span>
    </Link>
  );
}
