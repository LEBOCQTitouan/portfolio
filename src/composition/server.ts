import "server-only";
import { MdxContentRepository } from "@/adapters/content/mdx-content-repository";
import { ButtondownGateway } from "@/adapters/newsletter/buttondown-gateway";
import { makeContentUseCases } from "@/core/application/content";
import { makeSubscribe } from "@/core/application/subscribe";

const content = makeContentUseCases(new MdxContentRepository(), {
  includeDrafts: process.env.NODE_ENV === "development",
});

export const getAllPosts = content.listPosts;
export const getAllPostMeta = content.listPostMeta;
export const getPostBySlug = content.getPost;
export const getAllTags = content.listTags;
export const getPostsByTag = content.postsByTag;
export const getAllProjects = content.listProjects;
export const getProjectBySlug = content.getProject;
export const getFeaturedProjects = content.featuredProjects;

export const subscribe = makeSubscribe(new ButtondownGateway());
