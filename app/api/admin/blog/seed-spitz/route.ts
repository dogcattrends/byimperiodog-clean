import { NextResponse } from "next/server";

import { sanityClient } from "@/lib/sanity";

export async function POST() {
 try {
 const patches: Array<{ slug: string; tags: string[] }> = [
 {
 slug: "como-cuidar-do-seu-spitz-alemao-anao",
 tags: ["Spitz Alemão", "Lulu da Pomerânia", "filhote", "cuidados", "higiene e tosa"],
 },
 {
 slug: "spitz-alemao-anao-personalidade-e-convivio",
 tags: ["Spitz Alemão", "Lulu da Pomerânia", "filhote", "adestramento"],
 },
 ];

 const results: Array<{ slug: string; ok: boolean; id?: string; error?: string }> = [];
 for (const p of patches) {
 try {
 const id = await sanityClient.fetch<string | null>(
 `*[_type == "post" && slug.current == $slug][0]._id`,
 { slug: p.slug }
 );
 if (!id) {
 results.push({ slug: p.slug, ok: false, error: "post-not-found" });
 continue;
 }
 await sanityClient.patch(id).set({ tags: p.tags }).commit();
 results.push({ slug: p.slug, ok: true, id });
 } catch (e: unknown) {
 const msg = typeof e === "object" && e !== null && "message" in e ? String((e as { message?: unknown }).message ?? e) : String(e);
 results.push({ slug: p.slug, ok: false, error: msg });
 }
 }

 return NextResponse.json({ ok: true, updated: results.filter((r) => r.ok).length, results });
 } catch (err: unknown) {
 const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? err) : String(err);
 return NextResponse.json({ ok: false, error: msg }, { status: 500 });
 }
}

