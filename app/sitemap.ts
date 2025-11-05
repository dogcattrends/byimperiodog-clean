import type { MetadataRoute } from "next";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PUBLIC_ROUTES = [
  "/",
  "/filhotes",
  "/reserve-seu-filhote",
  "/sobre",
  "/blog",
  "/contato",
  "/faq-do-tutor",
  "/politica-de-privacidade",
  "/termos-de-uso",
  "/politica-editorial",
].filter((path) => !path.startsWith("/admin"));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br";

  // Fetch published Web Stories
  const supabase = supabaseAdmin();
  const { data: stories } = await supabase
    .from("web_stories")
    .select("slug, updated_at")
    .eq("status", "published");

  const staticRoutes = PUBLIC_ROUTES.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  const storyRoutes = (stories || []).map((story: { slug: string; updated_at: string }) => ({
    url: `${baseUrl}/web-stories/${story.slug}`,
    lastModified: new Date(story.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...storyRoutes];
}

