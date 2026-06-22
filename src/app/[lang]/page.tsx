import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { PillarCard } from "@/components/landing/pillar-card";
import { ProjectCard } from "@/components/project-card";
import { PostCard } from "@/components/post-card";
import { ContactCta } from "@/components/landing/contact-cta";
import { getFeaturedProjects, getAllProjects } from "@/composition/server";
import { getAllPosts } from "@/composition/server";
import { isLocale, defaultLocale } from "@/core/domain/locale";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/core/domain/site";
import { localizedHref } from "@/i18n/localized-href";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const routePath = "";

  return {
    title: dict.meta.siteTitle,
    description: dict.meta.siteDescription,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const featured = getFeaturedProjects(lang);
  const projects = (featured.length > 0 ? featured : getAllProjects(lang)).slice(0, 2);
  const posts = getAllPosts(lang).slice(0, 3);

  return (
    <div>
      <Hero t={dict.hero} lang={lang} />

      <section className="py-8" data-narrate="pillars">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted" data-bp-clear>{dict.home.whatIDo}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <PillarCard label={dict.home.systems} description={dict.home.systemsDesc} href={localizedHref(lang, "/work")} subject="systems" />
          <PillarCard label={dict.home.interfaces} description={dict.home.interfacesDesc} href={localizedHref(lang, "/work")} subject="interface" />
        </div>
      </section>

      {projects.length > 0 && (
        <section className="py-8" data-narrate="work">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted" data-bp-clear>{dict.home.selectedWork}</h2>
            <Link href={localizedHref(lang, "/work")} className="text-sm text-accent hover:underline">{dict.home.viewAll}</Link>
          </div>
          <div className="mt-2">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="py-8" data-narrate="writing">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted" data-bp-clear>{dict.home.latestWriting}</h2>
            <Link href={localizedHref(lang, "/blog")} className="text-sm text-accent hover:underline">{dict.home.readAll}</Link>
          </div>
          <div className="mt-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      <ContactCta t={dict.contact} />
    </div>
  );
}
