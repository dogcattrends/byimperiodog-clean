#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Script de diagnóstico para testar query de posts do blog no Sanity.
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const projectId = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION ?? process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2023-08-01';
const token = process.env.SANITY_TOKEN;

console.log('\n🔍 Diagnóstico de Posts do Blog\n');
console.log('📌 Variáveis de ambiente:');
console.log(' SANITY_PROJECT_ID:', projectId ? '✅ Configurada' : '❌ Ausente');
console.log(' SANITY_DATASET:', dataset ? '✅ Configurada' : '❌ Ausente');
console.log(' SANITY_TOKEN:', token ? '✅ (raw/drafts)' : '⚠️ (somente published)');

if (!projectId || !dataset) {
 console.error('\n❌ Variáveis de ambiente ausentes (SANITY_PROJECT_ID/SANITY_DATASET).');
 process.exit(1);
}

const sanity = createClient({ projectId, dataset, apiVersion, token, useCdn: !token, perspective: token ? 'raw' : 'published' });

async function main() {
 console.log('\n📊 Testando queries...\n');

 const totalCount = await sanity.fetch('count(*[_type=="post"])');
 const publishedCount = await sanity.fetch('count(*[_type=="post" && (status=="published" || defined(publishedAt))])');
 console.log(`✅ Total de posts: ${totalCount}`);
 console.log(`✅ Publicados: ${publishedCount}`);

 const recent = await sanity.fetch(
 '*[_type=="post"]|order(publishedAt desc, _updatedAt desc)[0...20]{"slug": slug.current, title, status, publishedAt}'
 );

 console.log(`\n📋 Últimos ${Array.isArray(recent) ? recent.length : 0} posts:`);
 (Array.isArray(recent) ? recent : []).forEach((post) => {
 const slug = String(post.slug || '').padEnd(40);
 const st = String(post.status || 'unknown').padEnd(10);
 const title = String(post.title || '').slice(0, 50);
 console.log(` ${st} | ${slug} | ${title}`);
 });

 console.log('\n✨ Diagnóstico concluído!\n');
}

main().catch((err) => {
 console.error('\n❌ Erro fatal:', err);
 process.exit(1);
});
