
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

function parsePeriod(period?: string) {
  if (!period || period === "30d") return 30;
  if (period === "7d") return 7;
  if (period === "90d") return 90;
  if (period === "365d") return 365;
  return 30;
}

export async function GET(req: Request) {
  try {
    const url = req ? new URL(req.url) : undefined;
    const period = url?.searchParams.get("period") || "30d";
    const author = url?.searchParams.get("author") || undefined;
    const category = url?.searchParams.get("category") || undefined;
    const days = parsePeriod(period);
    const now = new Date();
    const dStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const dStartIso = dStart.toISOString();

    const sb = supabaseAdmin();

    // Posts base query
    let postsQuery = sb
      .from("blog_posts")
      .select("id,slug,title,content_mdx,published_at,author_id", { count: "exact" })
      .eq("status", "published");
    if (author) postsQuery = postsQuery.eq("author_id", author);
    if (category) {
      // Join with blog_post_categories
      const { data: postCats } = await sb
        .from("blog_post_categories")
        .select("post_id")
        .eq("category_id", category);
      const postIds = (postCats || [])
        .map((c: unknown) => (c && typeof c === 'object' && 'post_id' in c ? String((c as { post_id?: unknown }).post_id) : null))
        .filter(Boolean) as string[];
      if (postIds.length) postsQuery = postsQuery.in("id", postIds);
      else postsQuery = postsQuery.in("id", ["00000000-0000-0000-0000-000000000000"]); // empty
    }
    const { data: published, count: totalPublished } = await postsQuery.order("published_at", { ascending: false }).limit(200);

    // Recent posts
    const recent = (published || []).slice(0, 10).map((p: Record<string, unknown>) => ({ slug: String(p.slug), title: String(p.title), published_at: p.published_at }));

    // Posts by category
    const { data: categories } = await sb.from("blog_categories").select("id,name");
    const { data: postCatsAll } = await sb.from("blog_post_categories").select("post_id,category_id");
    const catCounts: Record<string, number> = {};
    for (const cat of categories || []) catCounts[cat.id] = 0;
    for (const pc of postCatsAll || []) {
      if (catCounts[pc.category_id] !== undefined) catCounts[pc.category_id]++;
    }
    const posts_by_category = (categories || []).map((cat: Record<string, unknown>) => ({ category: String(cat.name), count: catCounts[String(cat.id)] || 0 }));

    // Posts by author
    const { data: authors } = await sb.from("authors").select("id,name");
    const authorCounts: Record<string, number> = {};
    for (const a of authors || []) authorCounts[a.id] = 0;
    for (const p of published || []) {
      if (authorCounts[p.author_id] !== undefined) authorCounts[p.author_id]++;
    }
    const posts_by_author = (authors || []).map((a: Record<string, unknown>) => ({ author: String(a.name), count: authorCounts[String(a.id)] || 0 }));

    // Posts by status
    const { data: postsAll } = await sb.from("blog_posts").select("id,status", { count: "exact" });
    const statusCounts: Record<string, number> = {};
    for (const p of postsAll || []) {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    }
    const posts_by_status = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // Comments per day (últimos N dias)
    const { data: comments } = await sb
      .from("blog_comments")
      .select("id,created_at")
      .eq("approved", true)
      .gte("created_at", dStartIso);
    const comments_per_day: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const count = (comments || []).filter((c: unknown) => {
        return typeof c === 'object' && c !== null && 'created_at' in c && String((c as { created_at?: unknown }).created_at).slice(0, 10) === dateStr;
      }).length;
      comments_per_day.push({ date: dateStr, count });
    }

    // Top posts por comentários
    const { data: topByComments } = await sb
      .from("blog_comments")
      .select("post_id, posts:blog_posts!inner(slug,title)")
      .eq("approved", true)
      .order("post_id", { ascending: true })
      .limit(2000);
    const counts: Record<string, { slug: string; title: string; comments: number }> = {};
    for (const row of topByComments || []) {
      const r = row as Record<string, unknown>;
      const postsObj = r.posts as Record<string, unknown> | undefined;
      const slug = postsObj ? String(postsObj.slug ?? '') : undefined;
      const title = postsObj ? String(postsObj.title ?? '') : undefined;
      if (!slug) continue;
      if (!counts[slug]) counts[slug] = { slug, title: title || slug, comments: 0 };
      counts[slug].comments += 1;
    }
    const top = Object.values(counts).sort((a, b) => b.comments - a.comments).slice(0, 10);

    // Comentários últimos N dias
    const commentsLastN = (comments || []).length;

    // leitura média (estimativa 200 wpm)
    const times: number[] = (published || [])
      .map((p: Record<string, unknown>) => {
        const content = String(p.content_mdx || '');
        const wc = (content).split(/\s+/).filter(Boolean).length;
        return wc > 0 ? Math.max(1, Math.round(wc / 200)) : 0;
      })
      .filter((m: number) => m > 0);
    const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

    return NextResponse.json({
      total_published: totalPublished || 0,
      posts_last_period: (published || []).filter((p: unknown) => {
        return typeof p === 'object' && p !== null && 'published_at' in p && String((p as { published_at?: unknown }).published_at) >= dStartIso;
      }).length,
      comments_last_period: commentsLastN,
      avg_read_time_min: avg,
      top_posts_by_comments: top,
      recent_posts: recent,
      comments_per_day,
      posts_by_category,
      posts_by_author,
      posts_by_status,
      period_days: days,
    });
  } catch (err: unknown) {
    const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? err) : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

