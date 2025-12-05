import type { MetadataRoute } from "next";

import { CITIES, PUPPY_COLORS } from "@/domain/taxonomies";
import { getAllPosts } from "@/lib/content";
import { supabaseAnon } from "@/lib/supabaseAnon";

const COLORS = Object.values(PUPPY_COLORS);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.byimperiodog.com.br";

/**
 * Sitemap dinâmico completo com todas as rotas indexáveis
 * 
 * Inclui:
 * - Páginas estáticas (home, filhotes, blog, sobre, contato, etc.)
 * - Intent pages (comprar, preco, criador)
 * - Cores (/spitz-anao/cor/[color])
 * - Cidades (/spitz-anao/[city])
 * - Blog posts publicados
 * - Puppies disponíveis
 * - Web Stories publicadas
 * 
 * Exclui: /admin/*, drafts, preview, API routes
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const lastModified = now.toISOString();

  // ============================================================================
  // 1. Páginas estáticas principais
  // ============================================================================
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/filhotes`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/sobre`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contato`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/reserve-seu-filhote`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/faq-do-tutor`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/politica-de-privacidade`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/politica-editorial`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/termos-de-uso`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];

  // ============================================================================
  // 2. Intent pages (SEO)
  // ============================================================================
  const intentPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/comprar-spitz-anao`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/preco-spitz-anao`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/criador-spitz-confiavel`, lastModified, changeFrequency: "weekly", priority: 0.8 },
  ];

  // ============================================================================
  // 3. Páginas de cores (/spitz-anao/cor/[color])
  // ============================================================================
  const colorPages: MetadataRoute.Sitemap = Object.keys(PUPPY_COLORS).map((colorKey) => ({
    url: `${SITE_URL}/spitz-anao/cor/${colorKey}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ============================================================================
  // 4. Páginas de cidades (/spitz-anao/[city])
  // ============================================================================
  const cityPages: MetadataRoute.Sitemap = Object.entries(CITIES).map(([slug, city]) => ({
    url: `${SITE_URL}/spitz-anao/${slug}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // ============================================================================
  // 5. Blog posts publicados
  // ============================================================================
  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    const sb = supabaseAnon();
    const { data, error } = await sb
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (!error && data) {
      blogPosts = data.map((post: { slug: string; updated_at?: string | null; published_at?: string | null }) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updated_at || post.published_at || lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error("Erro ao buscar blog posts para sitemap:", err);
  }

  // Fallback: se não houver posts do Supabase, inclui posts do Contentlayer
  if (blogPosts.length === 0) {
    try {
      const { items } = await getAllPosts({ page: 1, pageSize: 200 });
      blogPosts = items.map((p) => ({
        url: `${SITE_URL}/blog/${p.slug}`,
        lastModified: p.updated || p.date || lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    } catch (err) {
      console.error("Fallback Contentlayer falhou no sitemap do blog:", err);
    }
  }

  // ============================================================================
  // 6. Puppies disponíveis (status=disponivel)
  // ============================================================================
  let puppyPages: MetadataRoute.Sitemap = [];
  try {
    const sb = supabaseAnon();
    const { data, error } = await sb
      .from("puppies")
      .select("slug, updated_at")
      .in("status", ["disponivel", "available"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      puppyPages = data.map((puppy: { slug: string; updated_at?: string | null }) => ({
        url: `${SITE_URL}/filhotes/${puppy.slug}`,
        lastModified: puppy.updated_at || lastModified,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error("Erro ao buscar puppies para sitemap:", err);
  }

  // ============================================================================
  // 7. Web Stories publicadas
  // ============================================================================
  let webStories: MetadataRoute.Sitemap = [];
  try {
    const sb = supabaseAnon();
    const { data, error } = await sb
      .from("web_stories")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      webStories = data.map((story: { slug: string; updated_at?: string | null }) => ({
        url: `${SITE_URL}/web-stories/${story.slug}`,
        lastModified: story.updated_at || lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }));
    }
  } catch (err) {
    console.error("Erro ao buscar web stories para sitemap:", err);
  }

  // ============================================================================
  // 8. Consolidar e retornar
  // ============================================================================
  return [
    ...staticPages,
    ...intentPages,
    ...colorPages,
    ...cityPages,
    ...blogPosts,
    ...puppyPages,
    ...webStories,
  ];
}

