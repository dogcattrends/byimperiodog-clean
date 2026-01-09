import { NextResponse } from "next/server";

import { listPublicPosts } from "@/lib/sanity/publicPosts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.byimperiodog.com.br";

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  try {
    const { posts } = await listPublicPosts({ page: 1, pageSize: 100 });
    const updated = posts.length
      ? new Date(posts[0].published_at || Date.now()).toISOString()
      : new Date().toISOString();

    const entries = posts
      .map((post) => {
        const url = `${SITE_URL}/blog/${post.slug}`;
        const title = escapeXml(post.title ?? post.slug);
        const summary = escapeXml(post.excerpt ?? "");
        const publishedAt = post.published_at
          ? new Date(post.published_at).toISOString()
          : new Date().toISOString();
        return `  <entry>\n    <title>${title}</title>\n    <link href="${url}" />\n    <id>${url}</id>\n    <updated>${publishedAt}</updated>\n    <summary>${summary}</summary>\n  </entry>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>By Império Dog - Blog</title>\n  <link href="${SITE_URL}/blog" />\n  <updated>${updated}</updated>\n  <id>${SITE_URL}/blog</id>\n${entries}\n</feed>`;

    return new NextResponse(xml, { headers: { "Content-Type": "application/atom+xml; charset=utf-8" } });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[atom] falha ao carregar posts do Sanity", error);
    }
    return new NextResponse("", { status: 500 });
  }
}
