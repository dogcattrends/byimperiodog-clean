import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabasePublic';

export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qRaw = (searchParams.get('q') || '').trim();
  const q = qRaw.replace(/\s+/g, ' ');
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const tokens = q.toLowerCase().split(' ').filter(Boolean).slice(0, 5);
  try {
    const sb = supabasePublic();
    let query = sb
      .from('blog_posts')
      .select('id,slug,title,excerpt,cover_url,published_at,status,tags', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(25);
    const like = `%${q}%`;
    // @ts-ignore - supabase types accept string expression for or()
    query = query.or(`title.ilike.${like},excerpt.ilike.${like}`);
    if (tokens.length) {
      const t0 = tokens[0];
      try { query = query.contains('tags', [t0]); } catch {}
    }
    const { data, error } = await query;
    if (error) throw error;
    const results = (data || []).map((r: any) => ({
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt || null,
      cover_url: r.cover_url || null,
      published_at: r.published_at || null,
    }));
    return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ results: [] }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }
}
