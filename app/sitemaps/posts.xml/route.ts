import { NextResponse } from 'next/server';

import { supabasePublic } from '@/lib/supabasePublic';

export const revalidate = 300;

const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');

export async function GET(){
  const sb = supabasePublic();
  const { data } = await sb.from('blog_posts')
    .select('slug,updated_at,published_at,status,cover_url')
    .eq('status','published')
    .limit(5000);
  const now = Date.now();
  const urls = (data || []).map((p: unknown) => {
    const row = p as unknown as Record<string, unknown>;
    const lastmod = String(row.updated_at ?? row.published_at ?? new Date().toISOString());
    const ageDays = (now - Date.parse(String(row.published_at ?? row.updated_at ?? lastmod))) / 86400000;
    const changefreq = ageDays < 7 ? 'daily' : 'weekly';
    const priority = ageDays < 7 ? '0.8' : '0.7';
    return { loc: `${site}/blog/${String(row.slug ?? '')}`, lastmod, changefreq, priority, img: String(row.cover_url ?? '') };
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls
    .map((u: { loc: string; lastmod: string; changefreq: string; priority: string; img?: string }) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority>${u.img ? `<image:image><image:loc>${u.img}</image:loc></image:image>` : ''}</url>`)
    .join('\n')}
\n</urlset>`;
  return new NextResponse(xml, { headers:{ 'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300, stale-while-revalidate=600' }});
}
