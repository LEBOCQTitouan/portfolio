import { ImageResponse } from "next/og";
import { getAllPosts, getPostBySlug } from "@/composition/server";
import { isLocale, defaultLocale } from "@/core/domain/locale";
import { site } from "@/core/domain/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPosts("en").map((post) => ({ slug: post.slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const post = getPostBySlug(locale, slug);
  const title = post?.title ?? site.title;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f1115",
          color: "#f5f5f7",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#2997ff", letterSpacing: 2 }}>
          {site.name.toUpperCase()}
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ fontSize: 28, color: "#a1a1a6" }}>
          engineering with the craft of design
        </div>
      </div>
    ),
    { ...size },
  );
}
