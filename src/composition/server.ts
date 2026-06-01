import "server-only";
import { MdxContentRepository } from "@/adapters/content/mdx-content-repository";
import { ButtondownGateway } from "@/adapters/newsletter/buttondown-gateway";
import { makeContentUseCases } from "@/core/application/content";
import { makeSubscribe } from "@/core/application/subscribe";
import type { Locale } from "@/i18n/config";

const content = makeContentUseCases(new MdxContentRepository(), {
  includeDrafts: process.env.NODE_ENV === "development",
});

export const getAllPosts = (locale: Locale) => content.listPosts(locale);
export const getAllPostMeta = (locale: Locale) => content.listPostMeta(locale);
export const getPostBySlug = (locale: Locale, slug: string) => content.getPost(locale, slug);
export const getAllTags = (locale: Locale) => content.listTags(locale);
export const getPostsByTag = (locale: Locale, tag: string) => content.postsByTag(locale, tag);
export const getAllProjects = (locale: Locale) => content.listProjects(locale);
export const getProjectBySlug = (locale: Locale, slug: string) => content.getProject(locale, slug);
export const getFeaturedProjects = (locale: Locale) => content.featuredProjects(locale);

export const subscribe = makeSubscribe(new ButtondownGateway());
