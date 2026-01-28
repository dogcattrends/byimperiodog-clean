import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { sanityClient } from '@/lib/sanity/client';

interface PublishBody { id?: string; slug?: string }

/**
 * POST /api/admin/blog/publish
 * Body: { id?: string; slug?: string }
 * Header: x-admin-token = ADMIN_TOKEN (ou DEBUG_TOKEN fallback)
 * Ação: status -> published (trigger preenche published_at se null)
 */
export async function POST(req: NextRequest) {
 const tokenHeader = req.headers.get('x-admin-token');
 const adminToken = process.env.ADMIN_TOKEN || process.env.DEBUG_TOKEN;
 if (!adminToken || tokenHeader !== adminToken) {
 return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
 }
 let parsed: unknown;
 try {
 parsed = await req.json();
 } catch {
 return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
 }
 const { id, slug } = (parsed as PublishBody) || {};
 if (!id && !slug) {
 return NextResponse.json({ error: 'missing-id-or-slug' }, { status: 400 });
 }
 try {
 const docId =
 id ||
 (await sanityClient.fetch<string | null>(
 `*[_type == "post" && slug.current == $slug][0]._id`,
 { slug }
 ));

 if (!docId) return NextResponse.json({ error: 'not-found' }, { status: 404 });

 const now = new Date().toISOString();
 await sanityClient
 .patch(docId)
 .set({ status: 'published' })
 .setIfMissing({ publishedAt: now })
 .commit({ autoGenerateArrayKeys: true });

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
