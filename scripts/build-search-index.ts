#!/usr/bin/env tsx
/**
 * Gera índice estático de busca em JSON a partir dos posts publicados no Sanity.
 * Campos: slug, title, excerpt, published_at (ordenado por data desc)
 * Uso: npx tsx scripts/build-search-index.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

import { sanityClient } from '../src/lib/sanity/client';

type SanitySearchRow = {
 slug?: { current?: string } | null;
 title?: string;
 excerpt?: string | null;
 description?: string | null;
 publishedAt?: string | null;
};

async function main() {
 const query = `
 *[_type == "post" && status == "published"]
 | order(coalesce(publishedAt, _createdAt) desc)[0...2000] {
 slug { current },
 title,
 excerpt,
 description,
 publishedAt
 }
 `;
 const data = await sanityClient.fetch<SanitySearchRow[]>(query);

 const rows = (data ?? [])
 .map((row) => {
 const slug = row.slug?.current;
 if (!slug) return null;
 const excerpt = (row.excerpt ?? row.description ?? "").slice(0, 300);
 return {
 slug,
 title: row.title ?? "",
 excerpt,
 published_at: row.publishedAt ?? null,
 url: `/blog/${slug}`,
 };
 })
 .filter(Boolean) as Array<{
 slug: string;
 title: string;
 excerpt: string;
 published_at: string | null;
 url: string;
 }>;

 const outDir = path.join(process.cwd(), 'public');
 mkdirSync(outDir, { recursive: true });
 const outFile = path.join(outDir, 'search-index.json');
 writeFileSync(
 outFile,
 JSON.stringify(
 {
 generatedAt: new Date().toISOString(),
 count: rows.length,
 items: rows,
 },
 null,
 0,
 ),
 );
 process.stdout.write(`search-index.json gerado com ${rows.length} itens.\n`);
}

main().catch((e) => {
 console.error('[build-search-index] erro', e);
 process.exit(1);
});
