
import { NextResponse } from 'next/server';

import { sanityClient } from '@/lib/sanity/client';

export const revalidate = 300;
const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');
export async function GET(){
 const tags = await sanityClient.fetch<string[]>(
 `array::unique(*[_type == "post" && status == "published"].tags[])`
 );
 const urls = (tags || [])
 .map((tag) => {
 const slug = String(tag ?? '').trim();
 if (!slug) return null;
 const lastmod = new Date().toISOString();
 return { loc: `${site}/topico/${encodeURIComponent(slug)}`, lastmod, changefreq: 'weekly', priority: '0.4' };
 })
 .filter(Boolean) as Array<{ loc: string; lastmod: string; changefreq: string; priority: string }>;
 const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
 .map((u: { loc: string; lastmod: string; changefreq: string; priority: string }) => ` <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
 .join('\n')}
</urlset>`;
 return new NextResponse(xml, { headers:{ 'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=600, stale-while-revalidate=900' }});
}
