#!/usr/bin/env tsx
/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import 'dotenv/config';
import { sanityClient } from '../src/lib/sanity/client';
import { blocksToPlainText, type SanityBlock } from '../src/lib/sanity/blocks';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '';

type SanityPostRow = {
	_id: string;
	slug?: string | null;
	title?: string | null;
	status?: string | null;
	publishedAt?: string | null;
	author?: { _ref?: string } | null;
	tldr?: string | null;
	keyTakeaways?: string[] | null;
	canonicalUrl?: string | null;
	seoDescription?: string | null;
	description?: string | null;
	content?: SanityBlock[];
	body?: SanityBlock[];
};

function hasText(value: unknown, minLen = 1) {
	if (typeof value !== 'string') return false;
	return value.trim().length >= minLen;
}

function deriveCanonical(post: SanityPostRow) {
	if (hasText(post.canonicalUrl)) return String(post.canonicalUrl);
	if (!SITE_URL || !hasText(post.slug)) return null;
	return `${SITE_URL.replace(/\/$/,'')}/blog/${post.slug}`;
}

function derivePostText(post: SanityPostRow) {
	const bodyText = blocksToPlainText(post.content ?? post.body);
	return bodyText;
}

async function run() {
	console.log('[seo-audit] Starting SEO audit for published posts...');
	try {
		const query = `*[_type=="post" && (status=="published" || defined(publishedAt))]{
 _id,
 "slug": slug.current,
 title,
 status,
 publishedAt,
 author,
 tldr,
 keyTakeaways,
 canonicalUrl,
 seoDescription,
 description,
 content,
 body
}`;

		const posts = await sanityClient.fetch<SanityPostRow[]>(query);
		const report: { id: string; slug?: string | null; title?: string | null; missing: string[] }[] = [];

		for (const p of Array.isArray(posts) ? posts : []) {
			const missing: string[] = [];

			if (!p.author?._ref) missing.push('author');

			if (!hasText(p.tldr, 20)) missing.push('tldr');

			if (!Array.isArray(p.keyTakeaways) || p.keyTakeaways.length === 0) missing.push('key_takeaways');

			const canonical = deriveCanonical(p);
			if (!canonical) missing.push('canonical');

			const postText = derivePostText(p);
			const hasJsonLd = Boolean(hasText(p.title) && (hasText(p.seoDescription) || hasText(p.description) || postText.length > 20));
			if (!hasJsonLd) missing.push('json_ld');

			if (missing.length) {
				report.push({ id: p._id, slug: p.slug, title: p.title, missing });
			}
		}

		if (!report.length) {
			console.log('[seo-audit] OK — all published posts have required SEO/editorial fields.');
			return;
		}

		console.log(`[seo-audit] Found ${report.length} published posts with missing fields:`);
		for (const row of report) {
			console.log(`- ${row.slug || row.id} — ${row.title || 'no title'} => missing: ${row.missing.join(', ')}`);
		}

		// Exit 0 to keep CI non-blocking; we still print summary so maintainers can act.
	} catch (e) {
		console.error('[seo-audit] Unexpected error', e);
	}
}

run();

