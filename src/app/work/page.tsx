import type { Metadata } from "next";
import { getAllProjects } from "@/composition/server";
import { ProjectCard } from "@/components/project-card";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected projects across backend systems and interfaces.",
};

export default function WorkPage() {
  const projects = getAllProjects();
  return (
    <section className="py-8">
      <h1 className="text-3xl font-bold tracking-tight">Work</h1>
      <p className="mt-2 text-muted" data-narrate="intro">
        Selected projects across backend systems and interfaces.
      </p>
      <div className="mt-8" data-narrate="projects">
        {projects.length === 0 ? (
          <p className="text-muted">No projects yet.</p>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))
        )}
      </div>
    </section>
  );
}
