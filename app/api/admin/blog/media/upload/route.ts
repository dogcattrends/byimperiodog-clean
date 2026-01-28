import { NextResponse } from "next/server";

import { requireAdmin, logAdminAction } from "../../../../../../src/lib/adminAuth";
import { rateLimit as rateLimitEdge } from "../../../../../../src/lib/rateLimit";
import { sanityClient } from "../../../../../../src/lib/sanity";
import { supabaseAdmin } from "../../../../../../src/lib/supabaseAdmin";
import { ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES } from "../../../../../../src/lib/uploadValidation";

export const runtime = "nodejs";

export async function POST(req: Request) {
 try {
 const auth = requireAdmin(req);
 if (auth) return auth;
 // Throttle uploads (Edge): 6/min per IP
 {
 const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
 ?? req.headers.get('cf-connecting-ip')
 ?? 'unknown';
 const rl = rateLimitEdge('admin-media-upload:'+ip, 6, 60_000);
 if (!rl.allowed) return NextResponse.json({ error: 'rate-limit' }, { status: 429 });
 }
 const contentType = req.headers.get("content-type") || "";
 if (!contentType.includes("multipart/form-data")) {
 return NextResponse.json({ error: "Envie multipart/form-data" }, { status: 400 });
 }

 const form = await req.formData();
 const file = form.get("file") as File | null;
 if (!file) return NextResponse.json({ error: "Campo 'file' é obrigatório" }, { status: 400 });
 if (!ALLOWED_IMAGE_MIME.has(file.type)) {
 return NextResponse.json({ error: "mime-nao-suportado" }, { status: 415 });
 }
 if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
 return NextResponse.json({ error: "arquivo-muito-grande", maxBytes: MAX_IMAGE_BYTES }, { status: 413 });
 }
 const role = (form.get("role") as string) || "gallery"; // 'cover'|'gallery'|'inline'
 const postId = (form.get("post_id") as string) || undefined;
 const postSlug = (form.get("post_slug") as string) || (form.get("slug") as string) || undefined;
 const alt = (form.get("alt") as string) || file.name;

 const sb = supabaseAdmin();
 const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
 // Garante que o bucket existe (cria se ausente)
 try {
 interface StorageLike {
 getBucket?: (name: string) => Promise<{ data?: unknown; error?: unknown }>;
 createBucket?: (name: string, opts?: unknown) => Promise<unknown>;
 from?: (path: string) => {
 upload?: (file: string, data: Uint8Array, opts?: unknown) => Promise<{ error?: unknown }>; 
 getPublicUrl?: (file: string) => { data?: { publicUrl?: string } };
 };
 }
 const maybeStorage = (sb as unknown as { storage?: StorageLike }).storage;
 if (maybeStorage && typeof maybeStorage.getBucket === 'function') {
 const { data: bInfo, error: bErr } = await maybeStorage.getBucket(bucket as string) as { data?: unknown; error?: unknown };
 if (bErr || !bInfo) {
 if (typeof maybeStorage.createBucket === 'function') {
 await maybeStorage.createBucket(bucket as string, { public: true }).catch(() => {});
 }
 }
 }
 } catch {
 /* noop: bucket check best-effort */
 }
 const bytes = await file.arrayBuffer();
 const ext = (file.type?.split("/")[1] || "bin").replace("jpeg", "jpg");
 const filename = `${role}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

 // attempt upload when storage API is present
 type StorageLikeTop = {
 from?: (path: string) => {
 upload?: (file: string, data: Uint8Array, opts?: unknown) => Promise<{ error?: unknown }>; 
 getPublicUrl?: (file: string) => { data?: { publicUrl?: string } };
 };
 getBucket?: (name: string) => Promise<{ data?: unknown; error?: unknown }>;
 createBucket?: (name: string, opts?: unknown) => Promise<unknown>;
 };

 const maybeStorage = (sb as unknown as { storage?: StorageLikeTop }).storage;
 let publicUrl: string | null = null;

 if (maybeStorage && typeof maybeStorage.from === 'function') {
 try {
 const uploader = maybeStorage.from(bucket as string);
 const uploadRes = await (uploader.upload ? uploader.upload(filename, new Uint8Array(bytes), { contentType: file.type || "application/octet-stream", upsert: false } as unknown) : Promise.resolve(undefined));
 if ((uploadRes as any)?.error) throw (uploadRes as any).error;
 const pub = uploader.getPublicUrl ? uploader.getPublicUrl(filename) : undefined;
 publicUrl = pub?.data?.publicUrl || null;
 } catch {
 // ignore upload errors - fallback to DB record
 publicUrl = null;
 }
 }

 const { data: inserted, error: insertErr } = await sb
 .from("media_assets")
 .insert([{ file_path: filename, alt, caption: null, tags: null, source: 'upload' }])
 .select("id")
 .single();
 if (insertErr) throw insertErr;

 if (postId) {
 try {
 await sb.from("post_media").insert([{ post_id: postId, media_id: inserted!.id, role }]);
 } catch {
 /* noop */
 }
 if (role === "cover" && publicUrl) {
 // `post_id` aqui pode ser legado (uuid do Supabase) ou id do Sanity.
 // Preferimos patch pelo slug quando fornecido.
 let sanityPostId: string | null = null;
 if (postSlug) {
 sanityPostId = await sanityClient.fetch<string | null>(
 `*[_type == "post" && slug.current == $slug][0]._id`,
 { slug: postSlug }
 );
 }
 if (!sanityPostId) {
 sanityPostId = postId;
 }
 if (sanityPostId) {
 await sanityClient.patch(sanityPostId).set({ coverUrl: publicUrl }).commit();
 }
 }
 }

 await logAdminAction({ route: '/api/admin/blog/media/upload', method: 'POST', action: 'media_upload', payload: { role, postId, url: publicUrl } });
 return NextResponse.json({ ok: true, url: publicUrl, media_id: inserted?.id, file_path: filename });
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : String(err);
 await logAdminAction({ route:'/api/admin/blog/media/upload', method:'POST', action:'media_upload_error', payload:{ msg } });
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}
