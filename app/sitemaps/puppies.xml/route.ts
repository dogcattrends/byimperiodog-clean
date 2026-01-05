
import { NextResponse } from 'next/server';

import { supabasePublic } from '@/lib/supabasePublic';

import type { Database } from '../../../src/types/supabase';

export const revalidate = 300;

export async function GET() {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');
  const sb = supabasePublic();
  const { data } = await sb
    .from('puppies')
    .select('id,updated_at,created_at,status')
    .in('status', [
      'disponivel',
      'reservado',
      'vendido',
      'available',
      'reserved',
      'sold',
    ])
    .limit(5000);
  type Puppy = Database['public']['Tables']['puppies']['Row'];
  const urls = (data || []).map((row: Puppy) => {
    const status = String(row.status ?? '');
    const lastmod = String(row.updated_at ?? row.created_at ?? new Date().toISOString());
    return {
      loc: `${site}/filhote/${String(row.id ?? '')}`,
      lastmod,
      changefreq: status === 'disponivel' || status === 'available' ? 'daily' : 'weekly',
      priority: status === 'disponivel' || status === 'available' ? '0.9' : '0.6',
    };
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u: { loc: string; lastmod: string; changefreq: string; priority: string }) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
    .join('\n')}
</urlset>`;
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
}
