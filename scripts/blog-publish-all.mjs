#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Publica todos os posts no Sanity em status draft ou review.
 * Uso: node scripts/blog-publish-all.mjs [--dry]
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const dry = process.argv.includes('--dry');
const projectId = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION ?? process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2023-08-01';
const token = process.env.SANITY_TOKEN;

if(!projectId || !dataset || !token){
 console.error('[publish-all] Variáveis SANITY_PROJECT_ID/SANITY_DATASET e SANITY_TOKEN são obrigatórias.');
 process.exit(1);
}

const sanity = createClient({ projectId, dataset, apiVersion, token, useCdn: false, perspective: 'raw' });

async function main(){
 const query = `*[_type=="post" && status in ["draft","review"]]{_id, "slug": slug.current, status, title}`;
 const posts = await sanity.fetch(query);

 if(!Array.isArray(posts) || posts.length===0){
 console.log('[publish-all] Nada a publicar');
 return;
 }
 console.log(`[publish-all] Encontrados ${posts.length} posts para publicar`);
 if(dry){
 posts.forEach(p=> console.log(` - ${p.slug || p._id} (${p.status})`));
 console.log('[publish-all] --dry ativo, nenhuma mudança aplicada.');
 return;
 }
 const now = new Date().toISOString();
 for(const p of posts){
 await sanity.patch(p._id).set({ status: 'published', publishedAt: now }).commit({ autoGenerateArrayKeys: true });
 }
 console.log('[publish-all] Publicação concluída.');
}

main();
