import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { sanityClient } from '@/lib/sanity/client';

/**
 * POST /api/admin/blog/unpublish
 * Body JSON: { id?: string; slug?: string; toStatus?: 'draft' | 'review' | 'archived'; keepPublishedAt?: boolean }
 * Auth: header x-admin-token must equal process.env.ADMIN_TOKEN (or FALLBACK process.env.DEBUG_TOKEN)
 * Effect: Set status to provided (default 'draft'); optionally nullify published_at.
 */
export async function POST(req: NextRequest) {
 const authHeader = req.headers.get('x-admin-token');
 const adminToken = process.env.ADMIN_TOKEN || process.env.DEBUG_TOKEN;
 if (!adminToken || authHeader !== adminToken) {
 return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
 }

 interface UnpublishBody { id?: string; slug?: string; toStatus?: 'draft' | 'review' | 'archived'; keepPublishedAt?: boolean }
 let parsed: unknown;
 try {
 parsed = await req.json();
 } catch {
 return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
 }

 const { id, slug, toStatus = 'draft', keepPublishedAt = false } = (parsed as UnpublishBody) || {};
 if (!id && !slug) {
 return NextResponse.json({ error: 'missing-id-or-slug' }, { status: 400 });
 }
 const allowed = ['draft', 'review', 'archived'];
 if (!allowed.includes(toStatus)) {
 return NextResponse.json({ error: 'invalid-toStatus' }, { status: 400 });
 }
 try {
 const docId =
 id ||
 (await sanityClient.fetch<string | null>(
 `*[_type == "post" && slug.current == $slug][0]._id`,
 { slug }
 ));

 if (!docId) return NextResponse.json({ error: 'not-found' }, { status: 404 });

 let patch = sanityClient.patch(docId).set({ status: toStatus });
 if (!keepPublishedAt) patch = patch.unset(['publishedAt']);
 await patch.commit({ autoGenerateArrayKeys: true });

 const post = await sanityClient.fetch<{
 _id: string;
 slug?: { current?: string } | null;
 status?: string | null;
 publishedAt?: string | null;
 _updatedAt?: string | null;
 title?: string | null;
 } | null>(
 `*[_type == "post" && _id == $id][0]{_id, slug, status, publishedAt, _updatedAt, title}`,
 { id: docId }
 );

 if (!post) return NextResponse.json({ error: 'not-found' }, { status: 404 });
 return NextResponse.json({
 ok: true,
 post: {
 id: post._id,
 slug: post.slug?.current || null,
 status: post.status || null,
 published_at: post.publishedAt || null,
 updated_at: post._updatedAt || null,
 title: post.title || null,
 },
 });
 } catch (e: unknown) {
 const msg = e instanceof Error ? e.message : 'unexpected-error';
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}
