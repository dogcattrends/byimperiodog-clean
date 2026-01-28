import { NextResponse } from 'next/server';

import { sanityClient } from '@/lib/sanity/client';

export const revalidate = 300;

const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');

export async function GET() {
 const query = `
 *[_type == "post" && status == "published"]{
 slug,
 coverUrl,
 publishedAt,
 _updatedAt
 } | order(coalesce(publishedAt, _updatedAt) desc)[0...5000]
 `;
 const posts = await sanityClient.fetch<
 Array<{ slug?: { current?: string } | null; coverUrl?: string | null; publishedAt?: string | null; _updatedAt?: string | null }>
 >(query);
 const now = Date.now();
 const urls = (posts ?? [])
 .map((post) => {
 const slug = post.slug?.current;
 if (!slug) return null;
 const lastmod = String(post._updatedAt ?? post.publishedAt ?? new Date().toISOString());
 const publishedAt = post.publishedAt ?? post._updatedAt;
 const ageDays = (now - Date.parse(String(publishedAt ?? lastmod))) / 86400000;
 const changefreq = ageDays < 7 ? 'daily' : 'weekly';
 const priority = ageDays < 7 ? '0.8' : '0.7';
 return {
 loc: `${site}/blog/${encodeURIComponent(slug)}`,
 lastmod,
 changefreq,
 priority,
 img: String(post.coverUrl ?? ''),
 };
 })
 .filter(Boolean) as Array<{ loc: string; lastmod: string; changefreq: string; priority: string; img?: string }>;
 const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls
 .map((u) => ` <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority>${
 u.img ? `<image:image><image:loc>${u.img}</image:loc></image:image>` : ''
 }</url>`)
 .join('\n')}
\n</urlset>`;
 return new NextResponse(xml, {
 headers: {
 'Content-Type': 'application/xml; charset=utf-8',
 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
 },
 });
}
