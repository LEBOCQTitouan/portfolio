import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, defaultLocale } from "@/i18n/config";
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
  const routePath = "/about";

  return {
    title: dict.about.title,
    description: dict.about.metaDescription,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      title: dict.about.title,
      description: dict.about.metaDescription,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

const experience = [
  {
    role: "Senior Software Engineer",
    org: "Company",
    period: "2023 — Present",
    blurb:
      "Lead backend systems work and design-minded product engineering. (Edit me.)",
  },
  {
    role: "Software Engineer",
    org: "Company",
    period: "2021 — 2023",
    blurb:
      "Built and scaled services and the interfaces on top of them. (Edit me.)",
  },
];

const skills = [
  { group: "Languages", items: ["TypeScript", "Go", "Rust", "Python"] },
  { group: "Backend", items: ["Postgres", "Kafka", "gRPC", "Distributed systems"] },
  { group: "Frontend", items: ["React", "Next.js", "Tailwind", "Accessibility"] },
  { group: "Infra", items: ["Cloudflare", "Docker", "CI/CD", "Observability"] },
];

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <section className="py-8">
      <MorphTitle name={PAGE_TITLE}>
        <h1 className="text-3xl font-bold tracking-tight">{dict.about.title}</h1>
      </MorphTitle>
      <div className="prose-content mt-6 max-w-2xl" data-narrate="intro">
        <p>
          I&apos;m Titouan — a software engineer who believes great engineering
          and great design are the same discipline aimed at different layers. I
          build robust backend systems and the interfaces that make them usable.
          (Edit this bio.)
        </p>
        <p>
          I care about clarity: clear systems, clear interfaces, and clear
          writing about both.
        </p>
      </div>

      <h2 className="mt-12 text-xl font-semibold tracking-tight">{dict.about.experience}</h2>
      <ol className="mt-4 space-y-6 border-l border-border pl-6" data-narrate="experience">
        {experience.map((job) => (
          <li key={`${job.org}-${job.period}`} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.65rem] top-1.5 h-2 w-2 rounded-full bg-accent"
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="font-semibold">
                {job.role} · {job.org}
              </h3>
              <span className="text-sm text-muted">{job.period}</span>
            </div>
            <p className="mt-1 text-muted">{job.blurb}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-xl font-semibold tracking-tight">{dict.about.skills}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2" data-narrate="skills">
        {skills.map((s) => (
          <div key={s.group}>
            <p className="text-sm font-semibold">{s.group}</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {s.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-border px-2 py-0.5 text-xs text-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
