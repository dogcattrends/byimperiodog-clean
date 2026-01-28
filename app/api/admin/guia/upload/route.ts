import { NextResponse } from "next/server";

import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "edge";

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20MB

function getPublicGuidePath(version: string) {
 if (version === "v2") return "guides/guia-v2.pdf";
 return "guides/guia.pdf";
}

export async function POST(req: Request) {
 const auth = requireAdmin(req);
 if (auth) return auth;

 try {
 const contentType = req.headers.get("content-type") || "";
 if (!contentType.includes("multipart/form-data")) {
 return NextResponse.json({ error: "Envie multipart/form-data" }, { status: 400 });
 }

 const form = await req.formData();
 const file = form.get("file") as File | null;
 const version = (form.get("version") as string | null) ?? "v1";

 if (!file) return NextResponse.json({ error: "Campo 'file' é obrigatório" }, { status: 400 });
 if (file.type !== "application/pdf") {
 return NextResponse.json({ error: "mime-nao-suportado" }, { status: 415 });
 }
 if (file.size <= 0 || file.size > MAX_PDF_BYTES) {
 return NextResponse.json({ error: "arquivo-muito-grande", maxBytes: MAX_PDF_BYTES }, { status: 413 });
 }

 const sb = supabaseAdmin();
 const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
 const path = getPublicGuidePath(version);

 const bytes = await file.arrayBuffer();

 // Upload (upsert) para manter URL estável
 await sb.storage
 .from(bucket)
 .upload(path, new Uint8Array(bytes), { contentType: "application/pdf", upsert: true });

 const pub = sb.storage.from(bucket).getPublicUrl(path);
 const publicUrl = pub?.data?.publicUrl || null;

 await logAdminAction({
 route: "/api/admin/guia/upload",
 method: "POST",
 action: "guia_pdf_upload",
 payload: { version, bucket, path, publicUrl },
 });

 return NextResponse.json({ ok: true, version, bucket, path, publicUrl });
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : String(err);
 await logAdminAction({
 route: "/api/admin/guia/upload",
 method: "POST",
 action: "guia_pdf_upload_error",
 payload: { msg },
 });
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}
