// PATH: app/api/admin/blog/route.ts
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { normalizeTags, sanitizeCategory } from "@/lib/blog/normalize";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const auth = requireAdmin(req);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
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

    const essentialCols = ["id", "slug", "title", "status", "created_at"];
    const preferredCols = [
      "excerpt",
      "scheduled_at",
      "published_at",
      "cover_url",
      "cover_alt",
      "category",
      "tags",
      "seo_title",
      "seo_description",
      "og_image_url",
      "seo_score",
    ];
    const missingColumnFrom = (error: { message?: string; details?: string } | null) => {
      const raw = `${error?.message || ""} ${error?.details || ""}`;
  const match = raw.match(/column\s+"?([\w.]+)"?\s+does not exist/i);
      if (!match) return null;
      const [, col] = match;
      return col?.split(".").pop() || null;
    };
    // Tipagem frouxa porém sem any explícito: encadeia métodos do builder Supabase
    type SupaResponse = { data: unknown[] | null; error: { message?: string; details?: string; code?: string } | null; count: number | null };
    type Builder = {
      select: (..._args: unknown[]) => Builder;
      eq: (col: string, val: unknown) => Builder;
      or: (expr: string) => Builder;
      gte: (col: string, val: unknown) => Builder;
      order: (col: string, opts: { ascending: boolean }) => Builder;
      range: (from: number, to: number) => Builder;
    } & PromiseLike<SupaResponse>;
    const buildQuery = (columns: string[]): Builder => {
      const cols = columns.join(",");
      let builder = sb.from("blog_posts").select(cols, { count: "exact" }) as unknown as Builder;
      if (status) builder = builder.eq("status", status);
      if (q) {
        builder = builder.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,slug.ilike.%${q}%`);
      }
      if (date) {
        try {
          const startIso = new Date(`${date}T00:00:00.000Z`).toISOString();
          builder = builder.gte("created_at", startIso);
        } catch {
          // ignore invalid date
        }
      }
      return builder.order("created_at", { ascending: false }).range((page - 1) * perPage, page * perPage - 1);
    };

    let selectableCols = [...essentialCols, ...preferredCols];
    let response: SupaResponse = { data: null, error: null, count: 0 };
    console.log('Tentando buscar posts com colunas:', selectableCols);
    
    for (let safety = 0; safety < 25; safety++) { // evita loop infinito improvável
      const attempt = (await buildQuery(selectableCols)) as SupaResponse;
      response = attempt;
      console.log('Tentativa', safety + 1, 'resposta:', {
        error: attempt.error,
        data: attempt.data ? `${attempt.data.length} posts encontrados` : 'nenhum dado',
        count: attempt.count
      });
      
      if (!attempt.error) break;
      const missing = missingColumnFrom(attempt.error);
      if (missing && selectableCols.includes(missing) && !essentialCols.includes(missing)) {
        console.log('Removendo coluna ausente:', missing);
        selectableCols = selectableCols.filter((col) => col !== missing);
        continue;
      }
      break;
    }

    const { data, error, count } = response as SupaResponse;
    if (error) throw error;
    return NextResponse.json({ items: data || [], page, perPage, total: count || 0 });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object"
        ? JSON.stringify(err)
        : String(err);
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
  const auth = requireAdmin(req);
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch (e) {
      console.error("blog_post_parse_error", e);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
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

    // Validação simples (poderia evoluir para Zod)
    const errors: string[] = [];
    const slugPattern = /^[a-z0-9-]{3,120}$/;
    if (!slug || typeof slug !== "string" || !slugPattern.test(slug)) errors.push("slug inválido (chars: a-z0-9- 3-120)");
    if (!title || typeof title !== "string" || title.trim().length < 3) errors.push("title mínimo 3 chars");
    if (tags && !Array.isArray(tags)) errors.push("tags deve ser array");
    if (errors.length) {
      return NextResponse.json({ error: "validation", details: errors }, { status: 400 });
    }

    if (!slug || !title) {
      return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
    }

    let supa;
    try {
      supa = supabaseAdmin();
    } catch (err) {
      console.error("supabase_admin_init_error", err);
      return NextResponse.json({ error: "Supabase admin client not available" }, { status: 500 });
    }
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
      const msg = (error as { message?: string } | null)?.message || "";
      const code = (error as { code?: string } | null)?.code || "";
      console.error("blog_post_insert_error", { code, msg, slug });
      if (code === "23505" || /duplicate key|slug_key/i.test(msg)) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
      }
      if (code === "23502") {
        return NextResponse.json({ error: "missing_required_field", details: msg }, { status: 400 });
      }
      if (code === "22P02") {
        return NextResponse.json({ error: "invalid_text_representation", details: msg }, { status: 400 });
      }
      if (/permission denied|rls/i.test(msg)) {
        return NextResponse.json({ error: "permission_denied", details: msg }, { status: 403 });
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
  } catch (err: unknown) {
    // Log bruto para investigação futura
    console.error("blog_post_unhandled_error_raw", err);
    const msg = err instanceof Error ? err.message : typeof err === "object" ? JSON.stringify(err) : String(err);
    if (/duplicate key|slug_key/i.test(msg) || (err as { code?: string } | null)?.code === "23505") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    if ((err as { code?: string } | null)?.code === "23502") {
      return NextResponse.json({ error: "missing_required_field", details: msg }, { status: 400 });
    }
    if ((err as { code?: string } | null)?.code === "22P02") {
      return NextResponse.json({ error: "invalid_text_representation", details: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg || "internal_error" }, { status: 500 });
  }
}
