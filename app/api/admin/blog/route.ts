// PATH: app/api/admin/blog/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

function normalizeTags(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return Array.from(new Set(input.map((item) => String(item).trim().toLowerCase()).filter(Boolean)));
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

function sanitizeCategory(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  return str ? str : null;
}

export async function GET(req: Request) {
  const auth = requireAdmin(req as any);
  if (auth) return auth;
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const slug = url.searchParams.get("slug");
    const q = (url.searchParams.get("q") || "").trim();
    const status = (url.searchParams.get("status") || "").trim();
    const date = (url.searchParams.get("date") || "").trim();
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get("perPage") || "24", 10)));

    let sb;
    try {
      sb = supabaseAdmin();
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error("supabaseAdmin error:", msg);
      return NextResponse.json(
        { error: "Supabase admin client not available. Check SUPABASE_SERVICE_ROLE_KEY and env vars." },
        { status: 500 }
      );
    }

    if (id || slug) {
      if (id) {
        const { data, error } = await sb.from("blog_posts").select("*").eq("id", id).maybeSingle();
        if (error) throw error;
        return NextResponse.json(data ?? {});
      }
      if (slug) {
        const { data, error } = await sb.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
        if (error) throw error;
        return NextResponse.json(data ?? {});
      }
    }

    let baseCols = "id,slug,title,status,excerpt,scheduled_at,published_at,created_at,cover_url,cover_alt,category,tags,seo_title,seo_description,og_image_url";
    let query;
    try {
      query = sb.from("blog_posts").select(`${baseCols},seo_score`, { count: "exact" });
    } catch {
      query = sb.from("blog_posts").select(baseCols, { count: "exact" });
    }
    if (status) query = query.eq("status", status);
    if (q) {
      query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,slug.ilike.%${q}%`);
    }
    if (date) {
      try {
        const startIso = new Date(`${date}T00:00:00.000Z`).toISOString();
        query = (query as any).gte("created_at", startIso);
      } catch {
        // ignore invalid date
      }
    }
    query = query.order("created_at", { ascending: false }).range((page - 1) * perPage, page * perPage - 1);
    const { data, error, count } = (await query) as any;
    if (error) throw error;
    return NextResponse.json({ items: data || [], page, perPage, total: count || 0 });
  } catch (err: any) {
    const message = err?.message || String(err);
    if (/supabase_offline_stub/i.test(message)) {
      try {
        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get("perPage") || "24", 10)));
        return NextResponse.json({ items: [], page, perPage, total: 0 });
      } catch {
        return NextResponse.json({ items: [], page: 1, perPage: 24, total: 0 });
      }
    }
    console.error("API admin/blog error:", message);
    if (message.includes("Could not find the table 'public.blog_posts'")) {
      return NextResponse.json(
        { error: "Table 'blog_posts' not found. Apply sql/blog.sql to your Supabase." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req as any);
  if (auth) return auth;
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const sb = supabaseAdmin();
    const { data: post } = await sb.from("blog_posts").select("slug").eq("id", id).maybeSingle();
    const { error } = await sb.from("blog_posts").delete().eq("id", id);
    if (error) throw error;
    try {
      revalidatePath("/blog");
      if (post?.slug) revalidatePath(`/blog/${post.slug}`);
    } catch {
      // ignore revalidate errors
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err?.message || err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = requireAdmin(req as any);
  if (auth) return auth;
  try {
    const body = await req.json();
    const {
      id,
      slug,
      title,
      subtitle,
      excerpt,
      content_mdx,
      seo_title,
      seo_description,
      og_image_url,
      status,
      scheduled_at,
      published_at,
      cover_url,
      cover_alt,
      tags,
      category,
    } = body as Record<string, unknown>;

    if (!slug || !title) {
      return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
    }

    const supa = supabaseAdmin();
    const cleanTags = normalizeTags(tags);
    const cleanCategory = sanitizeCategory(category);

    if (id) {
      if (slug) {
        const { data: other } = await supa
          .from("blog_posts")
          .select("id")
          .eq("slug", slug)
          .neq("id", id)
          .maybeSingle();
        if (other) {
          return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
        }
      }
      const { data, error } = await supa
        .from("blog_posts")
        .update({
          slug,
          title,
          subtitle,
          excerpt,
          content_mdx,
          seo_title,
          seo_description,
          og_image_url,
          status,
          scheduled_at,
          published_at,
          cover_url,
          cover_alt,
          tags: cleanTags,
          category: cleanCategory,
        })
        .eq("id", id)
        .select("id,slug,status")
        .maybeSingle();
      if (error) throw error;
      try {
        revalidatePath("/blog");
        if (data?.slug) revalidatePath(`/blog/${data.slug}`);
      } catch {
        // ignore revalidate errors
      }
      return NextResponse.json(data ?? {});
    }

    const { data: existing } = await supa.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const { data, error } = await supa
      .from("blog_posts")
      .insert([
        {
          slug,
          title,
          subtitle,
          excerpt,
          content_mdx,
          seo_title,
          seo_description,
          og_image_url,
          status,
          scheduled_at,
          published_at,
          cover_url,
          cover_alt,
          tags: cleanTags,
          category: cleanCategory,
        },
      ])
      .select("id,slug,status")
      .single();
    if (error) {
      const msg = (error as any)?.message || "";
      const code = (error as any)?.code || "";
      if (code === "23505" || /duplicate key|slug_key/i.test(msg)) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
      }
      throw error;
    }
    try {
      revalidatePath("/blog");
      if (data?.slug) revalidatePath(`/blog/${data.slug}`);
    } catch {
      // ignore revalidate errors
    }
    return NextResponse.json(data ?? {});
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (/duplicate key|slug_key/i.test(msg) || err?.code === "23505") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error("API admin/blog error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
