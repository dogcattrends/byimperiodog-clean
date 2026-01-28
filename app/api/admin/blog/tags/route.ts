import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { sanityClient } from "@/lib/sanity/client";

function slugifyTag(v: string) {
 return v
 .toLowerCase()
 .normalize("NFD").replace(/\p{Diacritic}/gu, "")
 .replace(/[^a-z0-9\s-]/g, "")
 .replace(/\s+/g, "-")
 .replace(/-+/g, "-")
 .replace(/^-|-$/g, "");
}

// GET: lista tags; aceita ?q= para filtro básico por nome/slug.
export async function GET(req: NextRequest) {
 try {
 const url = new URL(req.url);
 const q = (url.searchParams.get("q") || "").trim().toLowerCase();
 const postIdsStr = url.searchParams.get("postIds") || ""; // comma-separated

 // Batch lookup: tags por lista de posts
 if (postIdsStr) {
 const ids = postIdsStr.split(",").map((s) => s.trim()).filter(Boolean);
 if (!ids.length) return NextResponse.json({});

 const posts = await sanityClient.fetch<Array<{ _id: string; slug?: string | null; tags?: string[] | null }>>(
 `*[_type == "post" && (_id in $ids || slug.current in $ids)]{
 _id,
 "slug": slug.current,
 tags
 }`,
 { ids }
 );

 const byKey = new Map<string, { _id: string; tags: string[] }>();
 for (const p of posts || []) {
 const t = Array.isArray(p.tags) ? p.tags : [];
 byKey.set(p._id, { _id: p._id, tags: t });
 if (p.slug) byKey.set(p.slug, { _id: p._id, tags: t });
 }

 const result: Record<string, { name: string; slug: string }[]> = {};
 for (const key of ids) {
 const hit = byKey.get(key);
 const tags = hit?.tags || [];
 result[key] = tags
 .map((name) => ({ name, slug: slugifyTag(name) }))
 .filter((t) => t.slug);
 }
 return NextResponse.json(result);
 }

 // Listagem simples de tags (derivada de posts publicados)
 const tags = await sanityClient.fetch<string[]>(
 `array::unique(*[_type == "post" && status == "published" && defined(tags)].tags[])`,
 {}
 );

 const items = (tags || [])
 .map((name) => ({ id: slugifyTag(String(name || '')), name: String(name || ''), slug: slugifyTag(String(name || '')) }))
 .filter((t) => t.slug)
 .filter((t) => !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q))
 .sort((a, b) => a.name.localeCompare(b.name));

 return NextResponse.json(items);
 } catch (err: unknown) {
 const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? err) : String(err);
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}

// POST: upsert simples de uma lista de nomes de tags; retorna tags normalizadas.
export async function POST(req: NextRequest) {
 try {
 const body = (await req.json()) as { tags?: string[] };
 const incoming = (body?.tags || []).map((s) => String(s || "").trim()).filter(Boolean);
 if (!incoming.length) return NextResponse.json({ ok: true, tags: [] });

 const seen = new Set<string>();
 const tags = incoming
 .map((name) => ({ name, slug: slugifyTag(name) }))
 .filter((t) => t.slug)
 .filter((t) => {
 if (seen.has(t.slug)) return false;
 seen.add(t.slug);
 return true;
 })
 .map((t) => ({ id: t.slug, name: t.name, slug: t.slug }));

 // Tags são um campo string[] em post; criação/upsert acontece ao salvar posts.
 return NextResponse.json({ ok: true, tags });
 } catch (err: unknown) {
 const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? err) : String(err);
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}
