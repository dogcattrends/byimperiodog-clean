import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { sanityClient } from "@/lib/sanity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface AttachBody {
 post_id?: string;
 post_slug?: string;
 slug?: string;
 media_id?: string;
 role?: string; // cover|gallery|inline
 position?: number;
}

const ROLES = new Set(["cover", "gallery", "inline"]);

export async function POST(req: NextRequest) {
 const auth = requireAdmin(req);
 if (auth) return auth;
 let json: unknown;
 try { json = await req.json(); } catch { return NextResponse.json({ error: "invalid-json" }, { status: 400 }); }
 const { post_id, post_slug, slug, media_id, role = "gallery", position } = (json as AttachBody) || {};
 const resolvedSlug = (post_slug || slug || '').trim() || null;
 if ((!post_id && !resolvedSlug) || !media_id) return NextResponse.json({ error: "post_id (ou post_slug) e media_id required" }, { status: 400 });
 if (!ROLES.has(role)) return NextResponse.json({ error: "invalid-role" }, { status: 400 });
 const sb = supabaseAdmin();
 try {
 const { data: asset, error: aErr } = await sb.from("media_assets").select("id,file_path,alt").eq("id", media_id).maybeSingle();
 if (aErr) throw aErr;
 if (!asset) return NextResponse.json({ error: "media-not-found" }, { status: 404 });

 // Obtém URL pública (melhor gerar dinamicamente para evitar armazenar redundância)
 const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
 let publicUrl: string | null = null;
 try {
 interface StorageLike {
 from(path: string): { getPublicUrl(file: string): { data: { publicUrl: string } } };
 }
 const maybeStorage = (sb as unknown as { storage?: StorageLike }).storage;
 if (maybeStorage && typeof maybeStorage.from === 'function') {
 const { data: pub } = maybeStorage.from(bucket).getPublicUrl(asset.file_path);
 publicUrl = pub?.publicUrl || null;
 }
 } catch { /* ignore */ }

 if (role === "cover" && publicUrl) {
 let sanityPostId: string | null = null;
 if (post_id) {
 sanityPostId = post_id;
 }
 if (!sanityPostId && resolvedSlug) {
 sanityPostId = await sanityClient.fetch<string | null>(
 `*[_type == "post" && slug.current == $slug][0]._id`,
 { slug: resolvedSlug }
 );
 }
 if (sanityPostId) {
 await sanityClient.patch(sanityPostId).set({ coverUrl: publicUrl }).commit();
 }
 }

 // Inserir pivot (ignorar conflito - upsert-like silencioso)
 try {
 if (post_id) {
 await sb.from("post_media").insert([{ post_id, media_id, role, position: typeof position === "number" ? position : 0 }]);
 }
 } catch (e: unknown) {
 const msg = e instanceof Error ? e.message : String(e);
 // Conflito de chave primária => já associado, atualizar posição se fornecida
 if (/duplicate key|primary key/i.test(msg) && typeof position === "number") {
 await sb.from("post_media").update({ position }).eq("post_id", post_id).eq("media_id", media_id).eq("role", role);
 } else if (!/duplicate key|primary key/i.test(msg)) {
 throw e;
 }
 }
 await logAdminAction({ route: "/api/admin/blog/media/attach", method: "POST", action: "media_attach", payload: { post_id, media_id, role } });
 return NextResponse.json({ ok: true, post_id, media_id, role, cover_set: role === "cover" && !!publicUrl });
 } catch (e: unknown) {
 await logAdminAction({ route: "/api/admin/blog/media/attach", method: "POST", action: "media_attach_error", payload: { msg: e instanceof Error ? e.message : String(e) } });
 return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
 }
}
