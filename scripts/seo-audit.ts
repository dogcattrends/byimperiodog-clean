#!/usr/bin/env tsx
/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	console.error('[seo-audit] Missing Supabase env vars (SUPABASE_URL / SUPABASE_ANON_KEY). Skipping audit.');
	process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function run() {
	console.log('[seo-audit] Starting SEO audit for published posts...');
	try {
		const { data, error } = await supabase
			.from('blog_posts')
			.select('id,slug,title,author_id,tldr,key_takeaways,seo_description,excerpt,content_mdx,published_at,status')
			.eq('status', 'published');

		if (error) {
			console.error('[seo-audit] Supabase error:', error);
			return;
		}

		const posts = Array.isArray(data) ? data : [];
		const report: { id: string; slug?: string | null; title?: string | null; missing: string[] }[] = [];

		for (const p of posts) {
			const missing: string[] = [];

			if (!p.author_id) missing.push('author');

			if (!p.tldr || String(p.tldr).trim().length < 20) missing.push('tldr');

			if (!Array.isArray(p.key_takeaways) || p.key_takeaways.length === 0) missing.push('key_takeaways');

			if (!SITE_URL || !p.slug) missing.push('canonical');

			const hasJsonLd = Boolean(p.title && (p.seo_description || p.excerpt || (p.content_mdx && p.content_mdx.length > 20)));
			if (!hasJsonLd) missing.push('json_ld');

			if (missing.length) {
				report.push({ id: p.id, slug: p.slug, title: p.title, missing });
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

