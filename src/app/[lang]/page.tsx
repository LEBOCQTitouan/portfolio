import { notFound } from "next/navigation";
import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { PillarCard } from "@/components/landing/pillar-card";
import { ProjectCard } from "@/components/project-card";
import { PostCard } from "@/components/post-card";
import { ContactCta } from "@/components/landing/contact-cta";
import { getFeaturedProjects, getAllProjects } from "@/composition/server";
import { getAllPosts } from "@/composition/server";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const featured = getFeaturedProjects(lang);
  const projects = (featured.length > 0 ? featured : getAllProjects(lang)).slice(0, 2);
  const posts = getAllPosts(lang).slice(0, 3);

  return (
    <div>
      <Hero t={dict.hero} />

      <section className="py-8" data-narrate="pillars">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.home.whatIDo}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <PillarCard label={dict.home.systems} description={dict.home.systemsDesc} href="/work" />
          <PillarCard label={dict.home.interfaces} description={dict.home.interfacesDesc} href="/work" />
        </div>
      </section>

      {projects.length > 0 && (
        <section className="py-8" data-narrate="work">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.home.selectedWork}</h2>
            <Link href="/work" className="text-sm text-accent hover:underline">{dict.home.viewAll}</Link>
          </div>
          <div className="mt-2">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="py-8" data-narrate="writing">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.home.latestWriting}</h2>
            <Link href="/blog" className="text-sm text-accent hover:underline">{dict.home.readAll}</Link>
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
