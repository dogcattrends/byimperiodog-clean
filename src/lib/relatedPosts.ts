import { supabasePublic } from "@/lib/supabasePublic";

export function scoreRelatedPost(baseCats: string[], candidate: any) {
	const candidateCats = (candidate?.blog_post_categories || [])
		.map((c: any) => c?.blog_categories?.slug)
		.filter((s: any): s is string => typeof s === "string");
	const shared = candidateCats.filter((c: string) => baseCats.includes(c)).length;
	const pub = Date.parse(candidate?.published_at || "") || 0;
	const ageDays = (Date.now() - pub) / 86400000;
	const recencyScore = Math.max(0, 30 - ageDays);
	return shared * 10 + recencyScore;
}

export async function getRelatedPosts(slug: string, limit = 4) {
	const sb = supabasePublic();
	const baseRes = await sb
		.from("blog_posts")
		.select("id,slug,published_at,blog_post_categories(blog_categories(slug))")
		.eq("slug", slug)
		.maybeSingle();
	const base = (baseRes as any)?.data;
	if (!base) return [];

	const candRes = await sb
		.from("blog_posts")
		.select("id,slug,title,excerpt,published_at,blog_post_categories(blog_categories(slug)),blog_authors(name,slug)")
		.neq("id", base.id)
		.order("published_at", { ascending: false })
		.limit(limit as any);
	const candidates = (candRes as any)?.data || [];

	const baseCats = (base.blog_post_categories || []).map((c: any) => c?.blog_categories?.slug).filter(Boolean) as string[];

	const scored = candidates
		.map((c: any) => ({ c, score: scoreRelatedPost(baseCats, c) }))
		.sort((a: any, b: any) => b.score - a.score)
		.map((x: any) => x.c);

	return scored.slice(0, limit);
}
