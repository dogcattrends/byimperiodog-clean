import type { Metadata } from "next";
import { supabasePublic } from "./supabasePublic";

type Entity = { id: string; slug?: string | null; title?: string | null; excerpt?: string | null; cover_url?: string | null; og_image_url?: string | null };

export async function buildPostMetadata(slug: string): Promise<Metadata> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br";
  const sb = supabasePublic();

  // base post
  const { data: post } = await sb
    .from("blog_posts")
    .select("id,slug,title,excerpt,cover_url,og_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  // fallback if not published
  const url = `${site}/blog/${post?.slug ?? slug}`;

  // overrides
  let override: any = null;
  if (post?.id) {
    const { data: ovr } = await sb
      .from("seo_overrides")
      .select("data_json")
      .eq("entity_type", "post")
      .eq("entity_id", post.id)
      .maybeSingle();
    override = ovr?.data_json || null;
  }

  const title = override?.title ?? post?.title ?? "Post | Blog";
  const description = override?.description ?? post?.excerpt ?? undefined;
  const image = override?.og_image_url ?? post?.og_image_url ?? post?.cover_url ?? undefined;
  const canonical = override?.canonical ?? url;
  const robots = override?.robots as string | undefined;

  const md: Metadata = {
    title,
    description,
    alternates: { canonical },
    robots,
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      images: image ? [{ url: image as string, width: 1200, height: 630 }] : undefined,
    },
    twitter: image ? { card: "summary_large_image", images: [image as string] } : undefined,
  };

  return md;
}

