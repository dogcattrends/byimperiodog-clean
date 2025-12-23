import { supabasePublic } from '@/lib/supabasePublic';

export type RelatedPost = { id:string; slug:string; title:string; excerpt:string|null; published_at:string|null; authorName?:string; authorSlug?:string };

/**
 * Recupera posts relacionados combinando: categorias compartilhadas, tags (quando armazenadas via join), recência.
 * Estratégia: consulta supabase para categorias e autor do post base, depois busca candidatos e rankeia.
 */
export function scoreRelatedPost(baseCategories: string[], candidate: unknown) {
  const c = candidate as Record<string, unknown>;
  const rawCats = (c.blog_post_categories as unknown) || [];
  const pCats = (Array.isArray(rawCats) ? rawCats : []).map((c2) => {
    const obj = c2 as Record<string, unknown>;
    const cat = (obj.blog_categories as Record<string, unknown> | undefined)?.slug;
    return typeof cat === 'string' ? cat : undefined;
  }).filter(Boolean) as string[];
  const sharedCats = pCats.filter((x) => baseCategories.includes(x)).length;
  const days = c.published_at ? (Date.now() - new Date(String(c.published_at)).getTime()) / 86400000 : 999;
  const recencyScore = days < 1 ? 1.0 : days < 7 ? 0.8 : days < 30 ? 0.5 : 0.25;
  return sharedCats * 2 + recencyScore;
}

export async function getRelatedPosts(slug: string, limit = 8): Promise<RelatedPost[]> {
  const sb = supabasePublic();
  // Buscar base (incluindo categorias e autor)
  const { data: base } = await sb.from('blog_posts')
    .select('id,slug,title,excerpt,published_at, blog_authors(name,slug), blog_post_categories(category_id,blog_categories(name,slug))')
    .eq('slug', slug).eq('status','published').maybeSingle();
  if(!base) return [];
  const catSlugs = (Array.isArray(base.blog_post_categories) ? base.blog_post_categories : []).map((c: unknown) => {
    const obj = c as Record<string, unknown>;
    const slug = (obj.blog_categories as Record<string, unknown> | undefined)?.slug;
    return typeof slug === 'string' ? slug : undefined;
  }).filter(Boolean) as string[];

  // Buscar candidatos recentes (limite amplo)
  const { data: candidates } = await sb.from('blog_posts')
    .select('id,slug,title,excerpt,published_at, blog_authors(name,slug), blog_post_categories(category_id,blog_categories(slug))')
    .eq('status','published')
    .neq('slug', slug)
    .order('published_at', { ascending:false })
    .limit(120);
  const scored = ((Array.isArray(candidates) ? candidates : []) as unknown[])
    .map((p) => ({ post: p as Record<string, unknown>, score: scoreRelatedPost(catSlugs, p) }))
    .filter((x) => x.score > 0.3);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => {
    const p = s.post as Record<string, unknown>;
    return {
      id: String(p.id ?? ''),
      slug: String(p.slug ?? ''),
      title: String(p.title ?? ''),
      excerpt: (p.excerpt as string) ?? null,
      published_at: (p.published_at as string) ?? null,
      authorName: (p.blog_authors as Record<string, unknown> | undefined)?.name as string | undefined,
      authorSlug: (p.blog_authors as Record<string, unknown> | undefined)?.slug as string | undefined,
    } as RelatedPost;
  });
}
