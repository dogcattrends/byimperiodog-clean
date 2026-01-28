
import { NextResponse } from "next/server";

import { sanityClient } from "@/lib/sanity/client";
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

 // Posts (Sanity)
 const postFilterParts: string[] = ['_type == "post"', 'status == "published"'];
 if (author) postFilterParts.push('(author._ref == $author || author->slug.current == $author)');
 if (category) postFilterParts.push('(category == $category || $category in categories[]->slug.current)');
 const postFilter = postFilterParts.join(' && ');

 const totalPublished = await sanityClient.fetch<number>(
 `count(*[${postFilter}])`,
 { author, category }
 );

 const published = await sanityClient.fetch<Array<{
 _id: string;
 slug?: { current?: string } | null;
 title?: string | null;
 publishedAt?: string | null;
 _updatedAt?: string | null;
 author?: { _id?: string | null; name?: string | null } | null;
 category?: string | null;
 categories?: Array<{ title?: string | null; slug?: string | null }> | null;
 plain?: string | null;
 }>>(
 `*[
 ${postFilter}
 ] | order(coalesce(publishedAt, _updatedAt) desc)[0...200]{
 _id,
 slug,
 title,
 publishedAt,
 _updatedAt,
 author->{_id, name},
 category,
 categories[]->{title, "slug": slug.current},
 "plain": pt::text(coalesce(content, body))
 }`,
 { author, category }
 );

 // Recent posts
 const recent = (published || [])
 .slice(0, 10)
 .map((p) => ({ slug: p.slug?.current || p._id, title: String(p.title || p.slug?.current || p._id), published_at: p.publishedAt || null }));

 // Posts by category (Sanity)
 const categoryDocs = await sanityClient.fetch<Array<{ title?: string | null; slug?: string | null }>>(
 `*[_type == "category" && defined(slug.current)]{title, "slug": slug.current}`,
 {}
 );
 const catCounts: Record<string, number> = {};
 for (const cat of categoryDocs || []) {
 const key = String(cat.slug || '').toLowerCase();
 if (key) catCounts[key] = 0;
 }
 for (const p of published || []) {
 const cats = [
 p.category,
 ...(Array.isArray(p.categories) ? p.categories.map((c) => c?.slug || c?.title || null) : []),
 ]
 .map((v) => (v ? String(v).toLowerCase() : null))
 .filter(Boolean) as string[];
 for (const c of cats) {
 catCounts[c] = (catCounts[c] || 0) + 1;
 }
 }
 const posts_by_category = Object.entries(catCounts)
 .map(([categorySlug, count]) => ({ category: categorySlug, count }))
 .sort((a, b) => b.count - a.count);

 // Posts by author (Sanity)
 const authorDocs = await sanityClient.fetch<Array<{ _id: string; name?: string | null }>>(
 `*[_type == "author"]{_id, name}`,
 {}
 );
 const authorCounts: Record<string, number> = {};
 for (const a of authorDocs || []) authorCounts[a._id] = 0;
 for (const p of published || []) {
 const authorId = p.author?._id;
 if (authorId) authorCounts[authorId] = (authorCounts[authorId] || 0) + 1;
 }
 const posts_by_author = (authorDocs || [])
 .map((a) => ({ author: String(a.name || a._id), count: authorCounts[a._id] || 0 }))
 .sort((a, b) => b.count - a.count);

 // Posts by status (Sanity)
 const postsAll = await sanityClient.fetch<Array<{ status?: string | null; publishedAt?: string | null }>>(
 `*[_type == "post"]{status, publishedAt}`,
 {}
 );
 const statusCounts: Record<string, number> = {};
 for (const p of postsAll || []) {
 const st = String(p.status || 'draft');
 statusCounts[st] = (statusCounts[st] || 0) + 1;
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
 .select("post_id")
 .eq("approved", true)
 .order("post_id", { ascending: true })
 .limit(2000);
 const counts: Record<string, { slug: string; title: string; comments: number }> = {};
 for (const row of topByComments || []) {
 const r = row as Record<string, unknown>;
 const postId = String(r.post_id || '');
 if (!postId) continue;
 if (!counts[postId]) counts[postId] = { slug: postId, title: postId, comments: 0 };
 counts[postId].comments += 1;
 }
 const top = Object.values(counts).sort((a, b) => b.comments - a.comments).slice(0, 10);

 // Comentários últimos N dias
 const commentsLastN = (comments || []).length;

 // leitura média (estimativa 200 wpm)
 const times: number[] = (published || [])
 .map((p) => {
 const content = String(p.plain || '');
 const wc = content.split(/\s+/).filter(Boolean).length;
 return wc > 0 ? Math.max(1, Math.round(wc / 200)) : 0;
 })
 .filter((m) => m > 0);
 const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

 return NextResponse.json({
 total_published: totalPublished || 0,
 posts_last_period: (published || []).filter((p: unknown) => {
 return typeof p === 'object' && p !== null && 'publishedAt' in p && String((p as { publishedAt?: unknown }).publishedAt) >= dStartIso;
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

