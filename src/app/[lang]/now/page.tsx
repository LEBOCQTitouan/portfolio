import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export const metadata: Metadata = {
  title: "Now",
  description: "What I'm focused on right now.",
};

// Update this date and list when your focus changes.
const lastUpdated = "May 2026";

const focus = [
  "Building this site and writing more about systems and design craft.",
  "Going deeper on distributed systems reliability.",
  "Exploring the edges of polished, accessible web UI.",
];

export default async function NowPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <section className="py-8">
      <h1 className="text-3xl font-bold tracking-tight">{dict.now.title}</h1>
      <p className="mt-2 text-sm text-muted">{dict.now.lastUpdated} {lastUpdated}</p>
      <p className="mt-6 max-w-2xl text-muted" data-narrate="intro">
        {dict.now.focusedOn}
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-muted" data-narrate="focus">
        {focus.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted">
        This is a{" "}
        <a
          href="https://nownownow.com/about"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          {dict.now.nowPageLabel}
        </a>
        .
      </p>
    </section>
  );
}
