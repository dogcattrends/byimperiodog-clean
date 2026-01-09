import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { sanityClient } from "@/lib/sanity/client";

export const revalidate = 0;

// GET /api/search?q=termo&limit=10&offset=0&tag=slugTag
// Implementação Sanity-first: busca via GROQ com match em campos indexáveis.
export async function GET(req: NextRequest){
  const url = new URL(req.url);
  const rawQ = (url.searchParams.get('q')||'').trim();
  if(!rawQ || rawQ.length < 2){
    return NextResponse.json({ results:[], count:0, q:'', took_ms:0 }, { headers:{ 'Cache-Control':'no-store' } });
  }
  const started = Date.now();
  const tag = (url.searchParams.get('tag')||'').trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')||'10'),1),50);
  const offset = Math.max(Number(url.searchParams.get('offset')||'0'),0);
  const q = rawQ.replace(/\s+/g,' ');
  const search = `${q.replace(/\*/g, '').slice(0, 200)}*`;
  const tagClause = tag ? ' && $tag in tags' : '';
  const range = `[${offset}...${offset + limit - 1}]`;
  const query = `
    *[_type == "post" && status == "published" && (
      title match $search ||
      description match $search ||
      tldr match $search
    )${tagClause}]
    | order(coalesce(publishedAt, _updatedAt) desc)
    ${range}{
      "slug": coalesce(slug.current, _id),
      "title": coalesce(title, "Post"),
      "excerpt": coalesce(description, null),
      "cover_url": coalesce(coverUrl, coverImage.asset->url, mainImage.asset->url),
      "published_at": coalesce(publishedAt, _createdAt)
    }
  `;
  const params = { search, tag: tag || undefined } as unknown as Record<string, unknown>;
  const results = await sanityClient.fetch<Array<{ slug: string; title: string; excerpt: string | null; cover_url: string | null; published_at: string | null }>>(
    query,
    params
  );
  return NextResponse.json({ results, count: results.length, q, took_ms: Date.now()-started }, { headers:{ 'Cache-Control':'no-store' } });
}
