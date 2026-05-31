import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { ContentRepository } from "@/core/ports/content-repository";
import { parsePost, type Post } from "@/core/domain/post";
import { parseProject, type Project } from "@/core/domain/project";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/, "");
}

function readDir(dir: string): { raw: string; slug: string }[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => ({ raw: fs.readFileSync(path.join(dir, f), "utf8"), slug: slugFromFilename(f) }));
}

export class MdxContentRepository implements ContentRepository {
  listPosts(): Post[] {
    return readDir(POSTS_DIR).map(({ raw, slug }) => {
      const { data, content } = matter(raw);
      const minutes = Math.max(1, Math.round(readingTime(content).minutes));
      return parsePost(data, content, slug, minutes);
    });
  }
  listProjects(): Project[] {
    return readDir(PROJECTS_DIR).map(({ raw, slug }) => {
      const { data, content } = matter(raw);
      return parseProject(data, content, slug);
    });
  }
}
