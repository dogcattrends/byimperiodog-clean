/* eslint-disable @typescript-eslint/no-unused-vars, no-empty */
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
 const auth = requireAdmin(req);
 if (auth) return auth;

 try {
 const url = new URL(req.url);
 const limitParam = url.searchParams.get("limit");
 const limit = Math.min(200, Math.max(1, Number(limitParam ?? 200)));

 const sb = supabaseAdmin();
 const { data, error } = await sb
 .from("blog_comments")
 .select("id,post_id,post_slug,author_name,author_email,body,approved,created_at")
 .order("created_at", { ascending: false })
 .limit(limit);
 if (error) throw error;

 const rows = (data ?? []).map((row: {
 id: string;
 post_id: string;
 post_slug?: string | null;
 author_name: string | null;
 author_email: string | null;
 body: string | null;
 approved: boolean;
 created_at: string;
 }) => ({
 ...row,
 author: row.author_name ?? null,
 content: row.body ?? null,
 status: row.approved ? "approved" : "pending",
 }));

 return NextResponse.json(rows);
 } catch (err: unknown) {
 const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? err) : String(err);
 console.error(msg);
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}

export async function PATCH(req: Request) {
 const auth = requireAdmin(req);
 if (auth) return auth;

 try {
 const body = await req.json();
 const { id, approved } = body as { id?: string; approved?: boolean };
 if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
 const sb = supabaseAdmin();
 const { data, error } = await sb
 .from("blog_comments")
 .update({ approved })
 .eq("id", id)
 .select("id,post_id,post_slug,approved")
 .maybeSingle();
 if (error) throw error;
 try {
 revalidatePath("/blog");
 const slug = (data as any)?.post_slug;
 if (slug) revalidatePath(`/blog/${slug}`);
 } catch {}
 return NextResponse.json(data ?? {});
 } catch (err: unknown) {
 const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? err) : String(err);
 console.error(msg);
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}

export async function DELETE(req: Request) {
 const auth = requireAdmin(req);
 if (auth) return auth;

 try {
 const url = new URL(req.url);
 const id = url.searchParams.get("id");
 if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
 const sb = supabaseAdmin();
 const { data: comment } = await sb.from("blog_comments").select("post_slug").eq("id", id).maybeSingle();
 const { error } = await sb.from("blog_comments").delete().eq("id", id);
 if (error) throw error;
 try {
 revalidatePath("/blog");
 if ((comment as any)?.post_slug) revalidatePath(`/blog/${(comment as any).post_slug}`);
 } catch {}
 return NextResponse.json({ ok: true });
 } catch (err: unknown) {
 const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? err) : String(err);
 console.error(msg);
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}

