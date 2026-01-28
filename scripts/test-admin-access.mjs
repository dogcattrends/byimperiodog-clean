#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Testa acesso admin ao Sanity (SANITY_TOKEN)
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const projectId = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION ?? process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2023-08-01';
const token = process.env.SANITY_TOKEN;

console.log('\n🔍 Diagnóstico de Acesso Admin\n');
console.log('📌 Credenciais:');
console.log(' SANITY_PROJECT_ID:', projectId ? '✅' : '❌');
console.log(' SANITY_DATASET:', dataset ? '✅' : '❌');
console.log(' SANITY_TOKEN:', token ? '✅' : '❌');

if (!projectId || !dataset) {
 console.error('\n❌ SANITY_PROJECT_ID/SANITY_DATASET ausentes');
 process.exit(1);
}

if (!token) {
 console.error('\n❌ SANITY_TOKEN ausente (necessária para admin/raw)');
 process.exit(1);
}

const sanity = createClient({ projectId, dataset, apiVersion, token, useCdn: false, perspective: 'raw' });

async function main() {
 console.log('\n📊 Testando acesso admin...\n');

 const total = await sanity.fetch('count(*[_type=="post"])');
 const published = await sanity.fetch('count(*[_type=="post" && (status=="published" || defined(publishedAt))])');
 console.log(`✅ Total de posts no Sanity: ${total}`);
 console.log(`✅ Publicados: ${published}`);

 const recent = await sanity.fetch(
 '*[_type=="post"]|order(_updatedAt desc)[0...10]{_id, status, "slug": slug.current, title}'
 );

 if (Array.isArray(recent) && recent.length > 0) {
 console.log('\n📋 Posts encontrados:');
 recent.forEach(p => {
 console.log(` ${(p.status || 'unknown').padEnd(10)} | ${(p.slug || p._id).slice(0, 50)}`);
 });
 } else {
 console.log('\n⚠️ Nenhum post encontrado!');
 }

 console.log('\n🔎 Testando query listSummaries simulada...\n');
 const summaries = await sanity.fetch(
 '*[_type=="post"]|order(publishedAt desc, _createdAt desc)[0...50]{_id, status, "slug": slug.current, title, description, publishedAt}'
 );
 console.log(`✅ listSummaries retornou ${Array.isArray(summaries) ? summaries.length : 0} posts`);

 console.log('\n✨ Diagnóstico concluído!\n');
}

main().catch(err => {
 console.error('\n❌ Erro fatal:', err);
 process.exit(1);
});
