import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";

export const runtime = "edge"; // fast uploads when possible

export async function POST(req: Request) {
  try {
  const auth = requireAdmin(req as any);
  if (auth) return auth;
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Envie multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Campo 'file' é obrigatório" }, { status: 400 });
    const role = (form.get("role") as string) || "gallery"; // 'cover'|'gallery'|'inline'
    const postId = (form.get("post_id") as string) || undefined;
    const alt = (form.get("alt") as string) || file.name;

    const sb = supabaseAdmin();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
    // Garante que o bucket existe (cria se ausente)
    try {
      const { data: bInfo, error: bErr } = await (sb as any).storage.getBucket(bucket);
      if (bErr || !bInfo) {
        await (sb as any).storage.createBucket(bucket, { public: true }).catch(() => {});
      }
    } catch {}
    const bytes = await file.arrayBuffer();
    const ext = (file.type?.split("/")[1] || "bin").replace("jpeg", "jpg");
    const filename = `${role}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await (sb as any).storage.from(bucket).upload(filename, new Uint8Array(bytes), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (upErr) throw upErr;
    const { data: pub } = (sb as any).storage.from(bucket).getPublicUrl(filename);
    const url = pub.publicUrl as string;

    const { data: m, error: mErr } = await sb
      .from("media_assets")
      .insert([{ file_path: filename, alt, caption: null, tags: null, source:'upload' }])
      .select("id")
      .single();
    if(mErr) throw mErr;

    if (postId) {
      // attach to post
  // garantir tabela pivot
  try { await sb.from("post_media").insert([{ post_id: postId, media_id: m!.id, role }]); } catch {}
      if (role === "cover") {
        await sb.from("blog_posts").update({ cover_url: url, og_image_url: url }).eq("id", postId);
      }
    }

  await logAdminAction({ route:'/api/admin/blog/media/upload', method:'POST', action:'media_upload', payload:{ role, postId, url } });
  return NextResponse.json({ ok: true, url, media_id: m?.id, file_path: filename });
  } catch (err: any) {
  await logAdminAction({ route:'/api/admin/blog/media/upload', method:'POST', action:'media_upload_error', payload:{ msg: err?.message||String(err) } });
  return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
