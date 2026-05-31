import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { ContentRepository } from "@/core/ports/content-repository";
import { parsePost, type Post } from "@/core/domain/post";
import { parseProject, type Project } from "@/core/domain/project";
import { defaultLocale, type Locale } from "@/i18n/config";

function dir(locale: Locale, kind: "posts" | "projects") {
  return path.join(process.cwd(), "content", locale, kind);
}

function slugFromFilename(f: string) {
  return f.replace(/\.mdx?$/, "");
}

function readSlugs(d: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!fs.existsSync(d)) return out;
  for (const f of fs.readdirSync(d).filter((f) => /\.mdx?$/.test(f))) {
    out.set(slugFromFilename(f), path.join(d, f));
  }
  return out;
}

/** Canonical slug set = defaultLocale; each slug served from `locale` if present, else fallback. */
function localized(locale: Locale, kind: "posts" | "projects"): { raw: string; slug: string }[] {
  const base = readSlugs(dir(defaultLocale, kind));
  const loc = locale === defaultLocale ? base : readSlugs(dir(locale, kind));
  return [...base.keys()].map((slug) => {
    const file = loc.get(slug) ?? base.get(slug)!;
    return { raw: fs.readFileSync(file, "utf8"), slug };
  });
}

export class MdxContentRepository implements ContentRepository {
  listPosts(locale: Locale): Post[] {
    return localized(locale, "posts").map(({ raw, slug }) => {
      const { data, content } = matter(raw);
      return parsePost(data, content, slug, Math.max(1, Math.round(readingTime(content).minutes)));
    });
  }
  listProjects(locale: Locale): Project[] {
    return localized(locale, "projects").map(({ raw, slug }) => {
      const { data, content } = matter(raw);
      return parseProject(data, content, slug);
    });
  }
}
