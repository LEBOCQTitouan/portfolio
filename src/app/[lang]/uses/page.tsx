import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, defaultLocale } from "@/core/domain/locale";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/core/domain/site";
import { MorphTitle } from "@/components/transitions/morph-title";
import { PAGE_TITLE } from "@/lib/transitions/names";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const routePath = "/uses";

  return {
    title: dict.uses.title,
    description: dict.uses.metaDescription,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      title: dict.uses.title,
      description: dict.uses.metaDescription,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

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
  const dict = await getDictionary(lang);

  return (
    <section className="py-8">
      <MorphTitle name={PAGE_TITLE}>
        <h1 className="text-3xl font-bold tracking-tight">{dict.uses.title}</h1>
      </MorphTitle>
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
