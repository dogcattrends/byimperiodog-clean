import { NextResponse } from 'next/server';

import { sanityClient } from '@/lib/sanity/client';

export const runtime = 'nodejs';

function cacheJson(data:unknown, status=200){
  return NextResponse.json(data, { status, headers:{ 'Cache-Control':'s-maxage=120, stale-while-revalidate=300' } });
}

interface PostCandidate {
  id:string; slug:string; title:string|null; excerpt:string|null; cover_url:string|null; published_at:string|null;
  categories?: string[];
  tags?: string[];
  authorName?: string | null;
  authorSlug?: string | null;
  _score?: number; _overlap?: number;
}

function uniqLower(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function deriveStatus(publishedAt?: string | null, status?: string | null) {
  if (status) return status;
  if (!publishedAt) return 'draft';
  const ts = Date.parse(publishedAt);
  if (Number.isNaN(ts)) return 'draft';
  return ts > Date.now() ? 'scheduled' : 'published';
}

async function compute(slug:string){
  const base = await sanityClient.fetch<{
    _id: string;
    slug?: { current?: string } | null;
    status?: string | null;
    publishedAt?: string | null;
    category?: string | null;
    categories?: Array<{ slug?: string | null; title?: string | null }> | null;
    tags?: string[] | null;
  } | null>(
    `*[_type == "post" && slug.current == $slug][0]{
      _id,
      slug,
      status,
      publishedAt,
      category,
      categories[]->{"slug": slug.current, title},
      tags
    }`,
    { slug }
  );
  if(!base) return [];
  const baseStatus = deriveStatus(base.publishedAt ?? null, base.status ?? null);
  if (baseStatus !== 'published') return [];

  const baseCats = uniqLower([
    base.category ?? null,
    ...(Array.isArray(base.categories) ? base.categories.map((c) => c?.slug ?? c?.title ?? null) : []),
  ]);
  const baseTags = uniqLower(base.tags ?? []);

  const candidates = await sanityClient.fetch<Array<{
    _id: string;
    slug?: { current?: string } | null;
    title?: string | null;
    description?: string | null;
    coverUrl?: string | null;
    coverImage?: { asset?: { url?: string | null } | null } | null;
    mainImage?: { asset?: { url?: string | null } | null } | null;
    publishedAt?: string | null;
    _updatedAt?: string | null;
    status?: string | null;
    category?: string | null;
    categories?: Array<{ slug?: string | null; title?: string | null }> | null;
    tags?: string[] | null;
    author?: { name?: string | null; slug?: string | null } | null;
  }>>(
    `*[_type == "post" && slug.current != $slug && status == "published"]
      | order(coalesce(publishedAt, _updatedAt) desc)[0...140]{
        _id,
        slug,
        title,
        description,
        coverUrl,
        coverImage{asset->{url}},
        mainImage{asset->{url}},
        publishedAt,
        _updatedAt,
        status,
        category,
        categories[]->{"slug": slug.current, title},
        tags,
        author->{name, "slug": slug.current}
      }`,
    { slug }
  );

  let scored: PostCandidate[] = (candidates || []).map((p) => {
    const categories = uniqLower([
      p.category ?? null,
      ...(Array.isArray(p.categories) ? p.categories.map((c) => c?.slug ?? c?.title ?? null) : []),
    ]);
    const tags = uniqLower(p.tags ?? []);
    const overlapCats = categories.filter((id) => baseCats.includes(id)).length;
    const overlapTags = tags.filter((id) => baseTags.includes(id)).length;
    const publishedAt = p.publishedAt ?? p._updatedAt ?? null;
    const days = publishedAt ? (Date.now()-new Date(publishedAt).getTime())/86400000 : 999;
    const recency = days<1? 30 : days<7? 20 : days<30? 10 : 0;
    const meta = (p.description?5:0) + (p.title?5:0);
    const score = (overlapCats? overlapCats*25:0) + (overlapTags? overlapTags*10:0) + recency + meta;
    return {
      id: p._id,
      slug: p.slug?.current || p._id,
      title: p.title ?? null,
      excerpt: p.description ?? null,
      cover_url: p.coverUrl ?? p.coverImage?.asset?.url ?? p.mainImage?.asset?.url ?? null,
      published_at: publishedAt,
      categories,
      tags,
      authorName: p.author?.name ?? null,
      authorSlug: p.author?.slug ?? null,
      _score: score,
      _overlap: overlapCats + overlapTags,
    };
  }).sort((a,b)=> (b._score || 0) - (a._score || 0));

  // Fallback se não há overlap: usar posts mais recentes
  if(!scored.some((s)=> (s._overlap||0)>0)){
    scored = scored.sort((a,b)=> new Date(b.published_at||0).getTime() - new Date(a.published_at||0).getTime());
  }

  return scored.slice(0,8).map((p)=> ({
    id:p.id,
    slug:p.slug,
    title:p.title,
    excerpt:p.excerpt,
    cover_url:p.cover_url,
    published_at:p.published_at,
    authorName: p.authorName ?? null,
    authorSlug: p.authorSlug ?? null,
  }));
}

export async function POST(req:Request){
  try {
    const { slug } = await req.json().catch(()=>({}));
    if(!slug) return cacheJson({ ok:false, error:'slug required' },400);
    const related = await compute(slug);
    return cacheJson({ ok:true, related });
  } catch(e:any){
    return cacheJson({ ok:false, error:e?.message||'erro' },500);
  }
}

export async function GET(req:Request){
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if(!slug) return cacheJson({ ok:false, error:'slug required' },400);
  try {
    const related = await compute(slug);
    return cacheJson({ ok:true, related });
  } catch(e:any){
    return cacheJson({ ok:false, error:e?.message||'erro' },500);
  }
}
