/* eslint-disable @typescript-eslint/no-unused-vars, no-empty */
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { sanityClient } from "@/lib/sanity";

async function resolveIdAndSlug(value: string): Promise<{ id: string; slug: string | null } | null> {
 const doc = await sanityClient.fetch<{ _id: string; slug?: { current?: string | null } | null } | null>(
 `*[_type == "post" && (_id == $v || slug.current == $v)][0]{ _id, slug }`,
 { v: value }
 );
 if (!doc?._id) return null;
 return { id: doc._id, slug: doc.slug?.current ?? null };
}

// Publica em lote posts em rascunho/review (opcional: limitar quantidade)
export async function POST(req: Request) {
 try {
 const auth = requireAdmin(req);
 if (auth) return auth;

 const { limit = 20, ids }: { limit?: number; ids?: string[] } = await req.json().catch(()=>({}));
 const nowIso = new Date().toISOString();

 if (Array.isArray(ids) && ids.length) {
 const resolved = (await Promise.all(ids.slice(0, 100).map(resolveIdAndSlug))).filter(Boolean) as Array<{
 id: string;
 slug: string | null;
 }>;
 await Promise.all(resolved.map((p) => sanityClient.patch(p.id).set({ status: 'published', publishedAt: nowIso }).commit()));
 try {
 revalidatePath('/blog');
 for (const p of resolved) if (p.slug) revalidatePath(`/blog/${p.slug}`);
 } catch {}
 return NextResponse.json({ ok: true, updated: resolved.length });
 }

 const picked = await sanityClient.fetch<Array<{ _id: string; slug?: { current?: string | null } }>>(
 `*[_type == "post" && status in ["draft","review","scheduled"]] | order(_createdAt asc)[0...$limit]{ _id, slug }`,
 { limit: Math.min(100, Math.max(1, Number(limit) || 20)) }
 );
 if (!picked?.length) return NextResponse.json({ ok: true, updated: 0 });
 await Promise.all(picked.map((p) => sanityClient.patch(p._id).set({ status: 'published', publishedAt: nowIso }).commit()));
 try {
 revalidatePath('/blog');
 for (const p of picked) if (p.slug?.current) revalidatePath(`/blog/${p.slug.current}`);
 } catch {}
 return NextResponse.json({ ok: true, updated: picked.length });
 } catch (err: unknown) {
 const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? err) : String(err);
 return NextResponse.json({ ok: false, error: msg }, { status: 500 });
 }
}
