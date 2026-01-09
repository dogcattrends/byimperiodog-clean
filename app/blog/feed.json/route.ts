import { NextResponse } from "next/server";

import { listPublicPosts } from "@/lib/sanity/publicPosts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.byimperiodog.com.br";

export async function GET() {
  try {
    const { posts } = await listPublicPosts({ page: 1, pageSize: 100 });

    const feed = {
      version: "https://jsonfeed.org/version/1",
      title: "By Império Dog - Blog",
      home_page_url: `${SITE_URL}/blog`,
      feed_url: `${SITE_URL}/blog/feed.json`,
      items: posts.map((post) => ({
        id: `${SITE_URL}/blog/${post.slug}`,
        url: `${SITE_URL}/blog/${post.slug}`,
        title: post.title,
        summary: post.excerpt ?? "",
        date_published: post.published_at ? new Date(post.published_at).toISOString() : undefined,
      })),
    };

    return NextResponse.json(feed, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[feed] falha ao carregar posts do Sanity", error);
    }
    return new NextResponse("", { status: 500 });
  }
}
