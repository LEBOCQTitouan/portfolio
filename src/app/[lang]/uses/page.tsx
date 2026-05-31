import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Uses",
  description: "The tools, hardware, and software I use day to day.",
};

const categories = [
  {
    title: "Editor & Terminal",
    items: ["VS Code", "Neovim", "Ghostty", "zsh + starship"],
  },
  {
    title: "Languages & Tooling",
    items: ["TypeScript", "Go", "Rust", "pnpm / npm"],
  },
  {
    title: "Hardware",
    items: ["MacBook Pro", "External display", "Mechanical keyboard"],
  },
  {
    title: "Services",
    items: ["Cloudflare", "GitHub", "Linear", "Figma"],
  },
];

export default async function UsesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <section className="py-8">
      <h1 className="text-3xl font-bold tracking-tight">Uses</h1>
      <p className="mt-2 text-muted" data-narrate="intro">
        The tools I reach for day to day. (Edit this list.)
      </p>
      <div className="mt-8 space-y-8" data-narrate="tools">
        {categories.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-lg font-semibold tracking-tight">
              {cat.title}
            </h2>
            <ul className="mt-2 list-disc pl-5 text-muted">
              {cat.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
