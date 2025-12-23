// PATH: src/lib/blog/related.ts
// Wrapper para combinar estratégias de posts relacionados (Supabase vs Contentlayer)
// Mantém API simples para o front.

import { getRelatedPosts as getRelatedSupabase } from '@/lib/relatedPosts';
import { supabaseAnon } from '@/lib/supabaseAnon';

/**
 * Obtém posts relacionados independente da origem.
 * Prioriza Supabase (conteúdo dinâmico); fallback para contentlayer estático se retornar vazio.
 */
export async function getRelatedUnified(slug: string, limit = 6) {
  try {
    const supa = await getRelatedSupabase(slug, limit);
    return supa.slice(0, limit);
  } catch (e) {
    console.error('relatedUnified erro', e);
    return [];
  }
}
export async function getPostsByTag(tag: string, limit = 24) {
  try {
    const sb = supabaseAnon();
    const { data, error } = await sb
      .from('blog_posts')
      .select('slug,title,excerpt,cover_url,published_at')
      .contains('tags', [tag])
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('getPostsByTag error', e);
    return [];
  }
}
