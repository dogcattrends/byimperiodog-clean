import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import type { SanityBlock } from '@/lib/sanity/blocks';
import { blocksToPlainText } from '@/lib/sanity/blocks';
import { sanityClient } from '@/lib/sanity/client';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface FieldDiff { field:string; old: unknown; current: unknown }
function diffSnapshots(a: Record<string, unknown>, b: Record<string, unknown>): FieldDiff[] {
 const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
 const diffs: FieldDiff[] = [];
 for (const k of keys) {
 if (k === 'updated_at' || k === 'updated_by') continue;
 const av = a[k]; const bv = b[k];
 if (JSON.stringify(av) !== JSON.stringify(bv)) diffs.push({ field: k, old: av, current: bv });
 }
 return diffs;
}

function extractSlug(snapshot: Record<string, unknown> | null | undefined): string | null {
 const s = snapshot || {};
 const direct = typeof s.slug === 'string' ? s.slug : null;
 if (direct) return direct;
 const nested = s.slug as unknown;
 if (nested && typeof nested === 'object') {
 const cur = (nested as { current?: unknown }).current;
 if (typeof cur === 'string' && cur.trim()) return cur.trim();
 }
 const alt = (s as { post_slug?: unknown }).post_slug;
 if (typeof alt === 'string' && alt.trim()) return alt.trim();
 return null;
}

async function fetchCurrentFromSanityBySlug(slug: string) {
 const doc = await sanityClient.fetch<
 | {
 _id: string;
 title?: string | null;
 description?: string | null;
 seoTitle?: string | null;
 seoDescription?: string | null;
 coverUrl?: string | null;
 ogImageUrl?: string | null;
 canonicalUrl?: string | null;
 robots?: string | null;
 status?: string | null;
 publishedAt?: string | null;
 tags?: string[] | null;
 body?: SanityBlock[] | null;
 content?: SanityBlock[] | null;
 }
 | null
 >(
 `*[_type == "post" && slug.current == $slug][0]{
 _id,
 title,
 "description": coalesce(description, excerpt),
 seoTitle,
 seoDescription,
 coverUrl,
 ogImageUrl,
 canonicalUrl,
 robots,
 status,
 publishedAt,
 tags,
 body,
 content
 }`,
 { slug }
 );

 if (!doc?._id) return null;
 const blocks = (doc.content ?? doc.body ?? []) as SanityBlock[];
 const contentPlain = blocksToPlainText(blocks);

 // Normaliza chaves para aproximar o formato legado (snake_case)
 return {
 id: doc._id,
 slug,
 title: doc.title ?? null,
 excerpt: doc.description ?? null,
 content_mdx: contentPlain || null,
 seo_title: doc.seoTitle ?? null,
 seo_description: doc.seoDescription ?? null,
 cover_url: doc.coverUrl ?? null,
 og_image_url: doc.ogImageUrl ?? (doc.coverUrl ?? null),
 canonical_url: doc.canonicalUrl ?? null,
 robots: doc.robots ?? null,
 status: doc.status ?? null,
 published_at: doc.publishedAt ?? null,
 tags: doc.tags ?? null,
 } as Record<string, unknown>;
}

// GET /api/admin/blog/:id/versions/:versionId?diff=1
export async function GET(req: NextRequest, ctx: { params:{ id:string; versionId:string } }){
 const auth = requireAdmin(req); if(auth) return auth;
 const url = new URL(req.url);
 const wantDiff = url.searchParams.get('diff') === '1';
 const sb = supabaseAdmin();
 const { data: ver, error } = await sb.from('blog_post_versions').select('id,post_id,snapshot,reason,created_at').eq('id', ctx.params.versionId).eq('post_id', ctx.params.id).maybeSingle();
 if(error) return NextResponse.json({ error: error.message }, { status:500 });
 if(!ver) return NextResponse.json({ error:'not-found' }, { status:404 });
 if(!wantDiff) return NextResponse.json({ version: ver });
 const slug = extractSlug((ver as { snapshot?: unknown }).snapshot as Record<string, unknown> | undefined);
 const current = slug ? await fetchCurrentFromSanityBySlug(slug) : null;
 const diffs = diffSnapshots((ver.snapshot as Record<string, unknown>) || {}, current || {});
 return NextResponse.json({ version: ver, diff: diffs });
}
