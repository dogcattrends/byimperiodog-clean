import { NextResponse } from "next/server";

import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { sanityClient } from "@/lib/sanity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Calls the existing AI suggestion endpoint (if API key configured) and persists a suggestion
export async function POST(req: Request) {
 try {
 const auth = requireAdmin(req);
 if (auth) return auth;
 const body = await req.json();
 const { id, slug, title, excerpt, content_mdx } = body as { id?: string; slug?: string; title?: string; excerpt?: string; content_mdx?: string };
 if (!id && !slug) return NextResponse.json({ error: "id ou slug obrigatórios" }, { status: 400 });

 const payload = { title, excerpt, content_mdx, slug };

 const resp = await fetch(new URL("../../seo-suggestions", req.url).toString(), {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 });
 if (!resp.ok) {
 const txt = await resp.text();
 throw new Error(`SEO suggestions failed: ${txt}`);
 }
 const j = await resp.json();
 const suggestions = j.suggestions || {};

 const sb = supabaseAdmin();
 let postSlug = slug as string | undefined;
 if (!postSlug && id) {
 postSlug = (await sanityClient.fetch<string | null>(
 `*[_type == "post" && _id == $id][0].slug.current`,
 { id }
 )) ?? undefined;
 }
 if (!postSlug) return NextResponse.json({ error: "post não encontrado" }, { status: 404 });

 const { error: ins } = await sb
 .from("seo_suggestions")
 .insert([{ entity_type: "post", entity_ref: postSlug, entity_id: null, data_json: suggestions }]);
 if (ins) throw ins;

 logAdminAction({
 route: "/api/admin/blog/seo/generate",
 method: "POST",
 action: "seo_suggestion_create",
 payload: { slug: postSlug },
 });
 return NextResponse.json({ ok: true, suggestions });
 } catch (err: unknown) {
 const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? err) : String(err);
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}

