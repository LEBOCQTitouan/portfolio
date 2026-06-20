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

// Shared name/note rows — used by both the focus block and the AI block.
function NoteList({ entries }: { entries: readonly { name: string; note: string }[] }) {
  return (
    <dl className="space-y-3">
      {entries.map((e) => (
        <div key={e.name}>
          <dt className="font-medium">{e.name}</dt>
          <dd className="mt-0.5 text-sm text-muted">{e.note}</dd>
        </div>
      ))}
    </dl>
  );
}

// Plain, uniform pill — no fills.
function Pill({ label }: { label: string }) {
  return (
    <li className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
      {label}
    </li>
  );
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const about = dict.about;

  return (
    <section className="py-8">
      <MorphTitle name={PAGE_TITLE}>
        <h1 className="text-3xl font-bold tracking-tight">{about.title}</h1>
      </MorphTitle>
      <div className="prose-content mt-6 max-w-2xl" data-narrate="intro">
        {about.intro.map((para) => (
          <p key={para.slice(0, 24)}>{para}</p>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-semibold tracking-tight">{about.experience}</h2>
      <ol className="mt-4 space-y-6 border-l border-border pl-6" data-narrate="experience">
        {about.experienceItems.map((job) => (
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

      <h2 className="mt-12 text-xl font-semibold tracking-tight">{about.skills}</h2>

      <div
        className="mt-4 max-w-2xl border-l-2 border-accent pl-4"
        data-narrate="focus"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          {about.focusEyebrow}
        </p>
        <div className="mt-3">
          <NoteList entries={about.focusItems} />
        </div>
      </div>

      <div className="mt-8 grid max-w-2xl gap-x-8 gap-y-6 sm:grid-cols-2" data-narrate="skills">
        {about.skillGroups.map((s) => (
          <div key={s.group}>
            <p className="text-sm font-semibold">{s.group}</p>
            <p className="mt-0.5 text-xs text-muted">{s.caption}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {s.items.map((item) => (
                <Pill key={item} label={item} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-semibold tracking-tight">{about.aiHeading}</h2>
      <div className="mt-4 max-w-2xl" data-narrate="ai">
        <NoteList entries={about.aiThreads} />
        <ul className="mt-5 flex flex-wrap gap-2">
          {about.aiItems.map((item) => (
            <Pill key={item} label={item} />
          ))}
        </ul>
      </div>
    </section>
  );
}
