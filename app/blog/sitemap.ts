import { supabasePublic } from '@/lib/supabasePublic';
import type { MetadataRoute } from 'next';

interface BlogPostRow { slug: string; updated_at?: string | null; published_at?: string | null; status: string }
interface TagRow { slug: string; updated_at?: string | null; created_at?: string | null }

// Blog-only sitemap (scoped). No env modifications.
export const revalidate = 300; // 5 min

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/,'');
  const sb = supabasePublic();
  const { data } = await sb.from('blog_posts').select('slug,updated_at,published_at,status').eq('status','published').limit(1000);
  const posts: MetadataRoute.Sitemap = (data as BlogPostRow[] || []).map((p: BlogPostRow) => ({
    url: `${site}/blog/${p.slug}`,
    lastModified: p.updated_at || p.published_at || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  // Optional: include tags when available
  let tags: MetadataRoute.Sitemap = [];
  try {
    const { data: tagRows } = await sb.from('blog_tags').select('slug,updated_at,created_at').limit(1000);
    tags = (tagRows as TagRow[] || []).map((t: TagRow) => ({
      url: `${site}/blog/tag/${t.slug}`,
      lastModified: t.updated_at || t.created_at || new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));
  } catch {}
  return [
    { url: `${site}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    ...posts,
    ...tags,
  ];
}
