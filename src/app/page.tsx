import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { PillarCard } from "@/components/landing/pillar-card";
import { ProjectCard } from "@/components/project-card";
import { PostCard } from "@/components/post-card";
import { getFeaturedProjects, getAllProjects } from "@/lib/projects";
import { getAllPosts } from "@/lib/posts";

export default function HomePage() {
  const featured = getFeaturedProjects();
  const projects = (featured.length > 0 ? featured : getAllProjects()).slice(
    0,
    2,
  );
  const posts = getAllPosts().slice(0, 3);

  return (
    <div>
      <div data-narrate="hero">
          <Hero />
        </div>

      <section className="py-8" aria-label="What I do" data-narrate="pillars">
        <div className="grid gap-4 sm:grid-cols-2">
          <PillarCard
            label="Systems"
            description="Distributed, fast, reliable backends."
            href="/work"
          />
          <PillarCard
            label="Interfaces"
            description="Polished, accessible, delightful UI."
            href="/work"
          />
        </div>
      </section>

      {projects.length > 0 && (
        <section className="py-8" data-narrate="work">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Selected work</h2>
            <Link href="/work" className="text-sm text-accent hover:underline">
              View all →
            </Link>
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
            <h2 className="text-2xl font-bold tracking-tight">
              Latest writing
            </h2>
            <Link href="/blog" className="text-sm text-accent hover:underline">
              Read all →
            </Link>
          </div>
          <div className="mt-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
