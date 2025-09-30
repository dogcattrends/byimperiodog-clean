import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabasePublic';

export const revalidate = 300; // 5 min

const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');

export async function GET() {
  // Build dynamic lastmod by querying a lightweight max(updated_at)
  const sb = supabasePublic();
  const { data: latestPost } = await sb.from('blog_posts').select('updated_at,published_at').eq('status','published').order('updated_at',{ ascending:false }).limit(1);
  const lastMod = latestPost?.[0]?.updated_at || latestPost?.[0]?.published_at || new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${site}/sitemaps/posts.xml</loc><lastmod>${lastMod}</lastmod></sitemap>\n  <sitemap><loc>${site}/sitemaps/categories.xml</loc><lastmod>${lastMod}</lastmod></sitemap>\n  <sitemap><loc>${site}/sitemaps/tags.xml</loc><lastmod>${lastMod}</lastmod></sitemap>\n  <sitemap><loc>${site}/sitemaps/authors.xml</loc><lastmod>${lastMod}</lastmod></sitemap>\n  <sitemap><loc>${site}/sitemaps/puppies.xml</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>\n</sitemapindex>`;
  return new NextResponse(xml, { headers:{ 'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300, stale-while-revalidate=600' }});
}
