#!/usr/bin/env node
/* eslint-disable no-console */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSanityClient } from '@sanity/client';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url || !key){
 console.error('[scheduler] Missing SUPABASE env');
 process.exit(1);
}
const sb = createClient(url, key, { auth:{ persistSession:false } });

const sanityProjectId = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const sanityDataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET;
const sanityApiVersion = process.env.SANITY_API_VERSION ?? process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2023-08-01';
const sanityToken = process.env.SANITY_TOKEN;

if(!sanityProjectId || !sanityDataset || !sanityToken){
 console.error('[scheduler] Missing SANITY_PROJECT_ID/SANITY_DATASET/SANITY_TOKEN env');
 process.exit(1);
}

const sanity = createSanityClient({
 projectId: sanityProjectId,
 dataset: sanityDataset,
 apiVersion: sanityApiVersion,
 token: sanityToken,
 useCdn: false,
 perspective: 'raw',
});

async function fetchDue(){
 const nowIso = new Date().toISOString();
 const { data, error } = await sb.from('blog_post_schedule_events')
 .select('id,post_id,action,run_at,payload')
 .is('executed_at', null)
 .lte('run_at', nowIso)
 .order('run_at',{ ascending:true })
 .limit(10);
 if(error) throw error; return data||[];
}

function extractSlug(ev){
 if(ev && typeof ev === 'object'){
 if(typeof ev.post_slug === 'string' && ev.post_slug) return ev.post_slug;
 if(ev.payload && typeof ev.payload === 'object'){
 if(typeof ev.payload.post_slug === 'string' && ev.payload.post_slug) return ev.payload.post_slug;
 if(typeof ev.payload.slug === 'string' && ev.payload.slug) return ev.payload.slug;
 }
 }
 return null;
}

async function processOne(ev){
 if(ev.action === 'publish'){
 const slug = extractSlug(ev);
 if(!slug){
 console.log('[scheduler] Skip publish (missing slug). Legacy event needs migration.', ev.id);
 await sb.from('blog_post_schedule_events').update({ executed_at: new Date().toISOString() }).eq('id', ev.id);
 return;
 }

 const doc = await sanity.fetch(
 '*[_type=="post" && slug.current==$slug][0]{_id,status,publishedAt}',
 { slug }
 );

 if(!doc?._id){
 console.log('[scheduler] Skip publish (post not found in Sanity)', slug);
 await sb.from('blog_post_schedule_events').update({ executed_at: new Date().toISOString() }).eq('id', ev.id);
 return;
 }

 if(doc.status !== 'published' || !doc.publishedAt){
 await sanity.patch(doc._id)
 .set({ status: 'published', publishedAt: new Date().toISOString() })
 .commit({ autoGenerateArrayKeys: true });
 console.log('[scheduler] Published post', slug);
 } else {
 console.log('[scheduler] Skip publish (already published)', slug);
 }
 } else {
 console.log('[scheduler] Unknown action', ev.action);
 }
 await sb.from('blog_post_schedule_events').update({ executed_at: new Date().toISOString() }).eq('id', ev.id);
}

async function runOnce(){
 const due = await fetchDue();
 if(!due.length){
 console.log('[scheduler] No due events');
 return;
 }
 for(const ev of due){
 try { await processOne(ev); } catch(e){ console.error('[scheduler] Error processing', ev.id, e); }
 }
}

async function main(){
 const loop = process.argv.includes('--loop');
 if(loop){
 console.log('[scheduler] Loop mode');
 // eslint-disable-next-line no-constant-condition
 while(true){
 await runOnce();
 await new Promise(r=> setTimeout(r, 5000));
 }
 } else {
 await runOnce();
 }
}

main();
