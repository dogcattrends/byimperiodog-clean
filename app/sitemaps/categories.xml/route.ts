
import { NextResponse } from 'next/server';

import { supabasePublic } from '@/lib/supabasePublic';

// import type { Database } from '../../../src/types/supabase'; (unused)

export const revalidate = 300;
const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');
export async function GET(){
  const sb = supabasePublic();
  // Cast to an explicit shape because selected fields may not match generated DB types exactly.
  const { data } = await sb.from('blog_categories').select('slug,updated_at,created_at').limit(2000);
  const rows = (data as unknown) as Array<{ slug?: string | null; updated_at?: string | null; created_at?: string | null }>;
  const urls = (rows || []).map((row) => {
    const lastmod = String((row.updated_at ?? row.created_at) ?? new Date().toISOString());
    return { loc: `${site}/categorias/${String(row.slug ?? '')}`, lastmod, changefreq: 'weekly', priority: '0.5' };
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u: { loc: string; lastmod: string; changefreq: string; priority: string }) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
    .join('\n')}
\n</urlset>`;
  return new NextResponse(xml, { headers:{ 'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=600, stale-while-revalidate=900' }});
}
