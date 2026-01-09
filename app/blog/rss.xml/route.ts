import { NextResponse } from "next/server";

import { listPublicPosts } from "@/lib/sanity/publicPosts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.byimperiodog.com.br";

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  try {
    const { posts } = await listPublicPosts({ page: 1, pageSize: 100 });

    const itemsXml = posts
      .map((post) => {
        const title = escapeXml(post.title ?? post.slug);
        const description = escapeXml(post.excerpt ?? "");
        const url = `${SITE_URL}/blog/${post.slug}`;
        const pubDate = post.published_at
          ? new Date(post.published_at).toUTCString()
          : new Date().toUTCString();
        return `  <item>\n    <title>${title}</title>\n    <link>${url}</link>\n    <guid isPermaLink="true">${url}</guid>\n    <pubDate>${pubDate}</pubDate>\n    <description>${description}</description>\n  </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>By Império Dog - Blog</title>\n  <link>${SITE_URL}/blog</link>\n  <description>Artigos e guias sobre Spitz Alemão Anão, Lulu da Pomerânia e cuidados de filhotes</description>\n${itemsXml}\n</channel>\n</rss>`;

    return new NextResponse(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[rss] falha ao carregar posts do Sanity", error);
    }
    return new NextResponse("", { status: 500 });
  }
}
