import { sanityClient } from '@/lib/sanity/client';

function uniqLower(values: unknown): string[] {
	if (!Array.isArray(values)) return [];
	const out: string[] = [];
	const seen = new Set<string>();
	for (const v of values) {
		const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
		if (!s) continue;
		if (seen.has(s)) continue;
		seen.add(s);
		out.push(s);
	}
	return out;
}

export function scoreRelatedPost(baseCats: string[], candidate: any) {
	const legacyCats = (candidate?.blog_post_categories || [])
		.map((c: any) => c?.blog_categories?.slug)
		.filter((s: any): s is string => typeof s === 'string');
	const modernCats = uniqLower(candidate?.categories || []);
	const candidateCats = modernCats.length ? modernCats : legacyCats;

	const shared = candidateCats.filter((c: string) => baseCats.includes(c)).length;
	const pub = Date.parse(candidate?.published_at || '') || 0;
	const ageDays = (Date.now() - pub) / 86400000;
	const recencyScore = Math.max(0, 30 - ageDays);
	return shared * 10 + recencyScore;
}

export async function getRelatedPosts(slug: string, limit = 4) {
	const base = await sanityClient.fetch<{
		_id: string;
		slug?: { current?: string } | null;
		title?: string | null;
		description?: string | null;
		publishedAt?: string | null;
		_updatedAt?: string | null;
		status?: string | null;
		category?: string | null;
		categories?: Array<{ slug?: string | null; title?: string | null }> | null;
	} | null>(
		`*[_type == "post" && slug.current == $slug][0]{
			_id,
			slug,
			title,
			description,
			publishedAt,
			_updatedAt,
			status,
			category,
			categories[]->{"slug": slug.current, title}
		}`,
		{ slug }
	);
	if (!base) return [];
	if ((base.status ?? '') !== 'published') return [];

	const baseCats = uniqLower([
		base.category ?? null,
		...(Array.isArray(base.categories) ? base.categories.map((c) => c?.slug ?? c?.title ?? null) : []),
	]);

	const candidates = await sanityClient.fetch<Array<{
		_id: string;
		slug?: { current?: string } | null;
		title?: string | null;
		description?: string | null;
		coverUrl?: string | null;
		coverImage?: { asset?: { url?: string | null } | null } | null;
		mainImage?: { asset?: { url?: string | null } | null } | null;
		publishedAt?: string | null;
		_updatedAt?: string | null;
		category?: string | null;
		categories?: Array<{ slug?: string | null; title?: string | null }> | null;
		author?: { name?: string | null; slug?: string | null } | null;
	}>>(
		`*[_type == "post" && slug.current != $slug && status == "published"]
		| order(coalesce(publishedAt, _updatedAt) desc)[0...140]{
			_id,
			slug,
			title,
			description,
			coverUrl,
			coverImage{asset->{url}},
			mainImage{asset->{url}},
			publishedAt,
			_updatedAt,
			category,
			categories[]->{"slug": slug.current, title},
			author->{name, "slug": slug.current}
		}`,
		{ slug }
	);

	const normalized = (candidates || []).map((c) => {
		const categories = uniqLower([
			c.category ?? null,
			...(Array.isArray(c.categories) ? c.categories.map((x) => x?.slug ?? x?.title ?? null) : []),
		]);
		const published_at = c.publishedAt ?? c._updatedAt ?? null;
		return {
			id: c._id,
			slug: c.slug?.current || c._id,
			title: c.title ?? null,
			excerpt: c.description ?? null,
			published_at,
			categories,
			cover_url: c.coverUrl ?? c.coverImage?.asset?.url ?? c.mainImage?.asset?.url ?? null,
			blog_authors: c.author ? { name: c.author.name ?? null, slug: c.author.slug ?? null } : null,
		};
	});

	const scored = normalized
		.map((c: any) => ({ c, score: scoreRelatedPost(baseCats, c) }))
		.sort((a: any, b: any) => b.score - a.score)
		.map((x: any) => x.c);

	return scored.slice(0, limit);
}
