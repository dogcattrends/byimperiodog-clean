
import { NextResponse } from 'next/server';

import { sanityClient } from '@/lib/sanity/client';

// import type { Database } from '../../../src/types/supabase'; (unused)

export const revalidate = 300;
const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');
export async function GET(){
  const authors = await sanityClient.fetch<
    Array<{ slug?: { current?: string } | null; _updatedAt?: string | null; _createdAt?: string | null }>
  >(
    `*[_type == "author" && defined(slug.current)] | order(_updatedAt desc)[0...2000]{ slug, _updatedAt, _createdAt }`
  );
  const urls = (authors || [])
    .map((row) => {
      const slug = row.slug?.current;
      if (!slug) return null;
      const lastmod = String(row._updatedAt ?? row._createdAt ?? new Date().toISOString());
      return { loc: `${site}/autores/${encodeURIComponent(String(slug))}`, lastmod, changefreq: 'weekly', priority: '0.5' };
    })
    .filter(Boolean) as Array<{ loc: string; lastmod: string; changefreq: string; priority: string }>;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u: { loc: string; lastmod: string; changefreq: string; priority: string }) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
    .join('\n')}
\n</urlset>`;
  return new NextResponse(xml, { headers:{ 'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=600, stale-while-revalidate=900' }});
}
