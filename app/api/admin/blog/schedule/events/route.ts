import { NextResponse } from "next/server";

import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { sanityClient } from "@/lib/sanity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type EventRow = {
 id: string;
 post_id: string | null;
 post_slug?: string | null;
 run_at: string;
 action: string;
 executed_at: string | null;
 payload?: unknown;
 created_at?: string;
 post?: {
 id: string;
 title: string | null;
 slug: string | null;
 status: string | null;
 cover_url?: string | null;
 published_at?: string | null;
 scheduled_at?: string | null;
 } | null;
};

type DateRange = {
 from?: string | null;
 to?: string | null;
};

const SELECT_FIELDS = "id,post_id,post_slug,run_at,action,executed_at,created_at,payload";

function getPayloadSlug(payload: unknown): string | null {
 if (!payload || typeof payload !== "object") return null;
 const p = payload as Record<string, unknown>;
 const slug = p.post_slug ?? p.slug;
 return typeof slug === "string" && slug.trim() ? slug.trim() : null;
}

function buildRange(url: URL): DateRange {
 const from = url.searchParams.get("from");
 const to = url.searchParams.get("to");
 if (from || to) return { from, to };
 const month = url.searchParams.get("month");
 if (!month) return {};
 const start = new Date(`${month}-01T00:00:00Z`);
 if (Number.isNaN(start.getTime())) return {};
 const end = new Date(start);
 end.setMonth(end.getMonth() + 1);
 return { from: start.toISOString(), to: end.toISOString() };
}

export async function GET(req: Request) {
 const auth = requireAdmin(req);
 if (auth) return auth;
 const url = new URL(req.url);
 const range = buildRange(url);
 try {
 const sb = supabaseAdmin();
 let query = sb.from("blog_post_schedule_events").select(SELECT_FIELDS).order("run_at");
 if (range.from) query = query.gte("run_at", range.from);
 if (range.to) query = query.lt("run_at", range.to);
 const { data, error } = await query;
 if (error) throw error;
 const rows = ((data as EventRow[] | null) || []).map((row) => ({ ...row, post: null }));
 const slugs = Array.from(new Set(rows.map((r) => getPayloadSlug(r.payload)).filter(Boolean))) as string[];

 const posts = slugs.length
 ? await sanityClient.fetch<Array<{ _id: string; title?: string | null; status?: string | null; publishedAt?: string | null; slug?: { current?: string | null } | null; coverUrl?: string | null }>>(
 `*[_type == "post" && slug.current in $slugs]{ _id, title, status, publishedAt, slug, coverUrl }`,
 { slugs }
 )
 : [];
 const bySlug = new Map<string, { id: string; title: string | null; slug: string | null; status: string | null; cover_url: string | null; published_at: string | null; scheduled_at: string | null }>();
 for (const p of posts || []) {
 const s = p.slug?.current ?? null;
 if (!s) continue;
 bySlug.set(s, {
 id: p._id,
 title: p.title ?? null,
 slug: s,
 status: p.status ?? null,
 cover_url: p.coverUrl ?? null,
 published_at: p.publishedAt ?? null,
 scheduled_at: (p.status === "scheduled" ? p.publishedAt : null) ?? null,
 });
 }
 const hydrated = rows.map((r) => {
 const s = getPayloadSlug(r.payload);
 return { ...r, post: s ? bySlug.get(s) ?? null : null };
 });
 return NextResponse.json({ ok: true, items: hydrated });
 } catch (err: unknown) {
 const message = err instanceof Error ? err.message : String(err);
 return NextResponse.json({ ok: false, error: message }, { status: 500 });
 }
}

export async function POST(req: Request) {
 const auth = requireAdmin(req);
 if (auth) return auth;
 try {
 const body = await req.json().catch(() => ({}));
 const { post_slug, slug, run_at, action, payload } = body ?? {};
 const resolvedSlug = (typeof post_slug === "string" && post_slug.trim()) ? post_slug.trim() : (typeof slug === "string" && slug.trim() ? slug.trim() : null);
 if (!resolvedSlug || !run_at || !action) {
 return NextResponse.json({ ok: false, error: "post_slug (ou slug), run_at, action obrigatorios" }, { status: 400 });
 }
 const sb = supabaseAdmin();
 const mergedPayload = { ...(payload && typeof payload === 'object' ? payload : {}), post_slug: resolvedSlug };
 const { data, error } = await sb
 .from("blog_post_schedule_events")
 .insert([{ post_id: null, post_slug: resolvedSlug, run_at, action, payload: mergedPayload }])
 .select(SELECT_FIELDS)
 .single();
 if (error) throw error;

 if (action === "publish") {
 const postId = await sanityClient.fetch<string | null>(
 `*[_type == "post" && slug.current == $slug][0]._id`,
 { slug: resolvedSlug }
 );
 if (!postId) return NextResponse.json({ ok: false, error: "post não encontrado no Sanity" }, { status: 404 });
 await sanityClient.patch(postId).set({ status: "scheduled", publishedAt: run_at }).commit();
 }

 logAdminAction({
 route: "/api/admin/blog/schedule/events",
 method: "POST",
 action: "schedule_create",
 payload: { id: data?.id, post_slug: resolvedSlug, run_at, action },
 });
 const row = data as EventRow | null;
 return NextResponse.json({ ok: true, event: row });
 } catch (err: unknown) {
 const message = err instanceof Error ? err.message : String(err);
 return NextResponse.json({ ok: false, error: message }, { status: 500 });
 }
}

export async function DELETE(req: Request) {
 const auth = requireAdmin(req);
 if (auth) return auth;
 try {
 const url = new URL(req.url);
 const id = url.searchParams.get("id");
 if (!id) return NextResponse.json({ ok: false, error: "id obrigatorio" }, { status: 400 });
 const sb = supabaseAdmin();
 const { data: before } = await sb
 .from("blog_post_schedule_events")
 .select("post_id, run_at, action")
 .eq("id", id)
 .maybeSingle();
 const { error } = await sb.from("blog_post_schedule_events").delete().eq("id", id);
 if (error) throw error;
 logAdminAction({
 route: "/api/admin/blog/schedule/events",
 method: "DELETE",
 action: "schedule_delete",
 payload: { id, before },
 });
 return NextResponse.json({ ok: true });
 } catch (err: unknown) {
 const message = err instanceof Error ? err.message : String(err);
 return NextResponse.json({ ok: false, error: message }, { status: 500 });
 }
}

export const dynamic = "force-dynamic";
