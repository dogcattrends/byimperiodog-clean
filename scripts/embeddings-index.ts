#!/usr/bin/env tsx
/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';

import { sanityClient } from '../src/lib/sanity/client';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.OPENAI_API_KEY;
if(!url || !key) { console.error('Missing Supabase env'); process.exit(1); }
const supa = createClient(url, key, { auth: { persistSession: false } });

type SanityBlock = {
  _type?: string;
  children?: Array<{ text?: string }>;
};

type SanityPostRecord = {
  _id?: string;
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  content?: SanityBlock[];
  slug?: { current?: string } | null;
};

async function fetchSanityPosts(): Promise<Array<{
  id: string;
  slug: string;
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  content?: SanityBlock[];
}>> {
  const query = `
    *[_type == "post" && status == "published"]
      | order(coalesce(publishedAt, _createdAt) desc)[0...500] {
        _id,
        title,
        excerpt,
        description,
        content,
        slug { current }
      }
  `;
  const posts = await sanityClient.fetch<SanityPostRecord[]>(query);
  return (posts ?? [])
    .filter((post): post is SanityPostRecord & { _id: string } => typeof post._id === 'string')
    .map((post) => ({
      id: post._id,
      slug: post.slug?.current ?? post._id,
      title: post.title,
      excerpt: post.excerpt,
      description: post.description,
      content: post.content,
    }));
}

function toPlain(md: string): string {
  return md.replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`]/g, ' ').replace(/\s+/g, ' ').trim();
}

function blocksToPlainText(blocks?: SanityBlock[]) {
  if(!blocks?.length) return '';
  return blocks
    .map((block) => block?.children?.map((child) => child.text ?? '').join('') ?? '')
    .filter(Boolean)
    .join('\n\n');
}

async function embed(texts: { id: string; input: string; meta: Record<string, unknown> }[]) {
  if(!openaiKey){
    // fallback deterministico (hash simples -> vetor curto) apenas para nao quebrar dev
    return texts.map(t=> ({ id: t.id, embedding: fakeVector(t.input) }));
  }
  const batches: { id: string; input: string; meta: any }[][] = [];
  const size = 32;
  for(let i=0;i<texts.length;i+=size) batches.push(texts.slice(i,i+size));
  const out: { id: string; embedding: number[] }[] = [];
  for(const b of batches){
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: b.map(x=>x.input) })
    });
    if(!res.ok){ const txt = await res.text(); throw new Error('Embedding API falhou: '+txt); }
    const j = await res.json();
    if (!j || !Array.isArray(j.data)) throw new Error('Embedding API retornou formato inesperado');
    j.data.forEach((row: { embedding: number[] }, idx: number) => { out.push({ id: b[idx].id, embedding: row.embedding }); });
  }
  return out;
}

function fakeVector(s: string): number[] {
  const arr = new Array(10).fill(0);
  let h=0;
  for(const ch of s) { h = (h*31 + ch.charCodeAt(0))>>>0; }
  for(let i=0;i<arr.length;i++){ arr[i] = ( (h >> (i*3)) & 255 ) / 255; }
  return arr;
}

async function upsertEmbeddings(rows: { id: string; slug: string; embedding: number[]; source: string }[]) {
  const payload = rows.map(r=> ({ post_id: r.id, source: r.source, embedding: JSON.stringify(r.embedding) }));
  const { error } = await supa.from('blog_post_embeddings').upsert(payload, { onConflict: 'post_id,source' });
  if(error) throw error;
}

// Leitura simples de posts MDX (Contentlayer) manual caso queira indexar tambem
function loadContentlayerMdx(): { slug: string; body: string }[] {
  const dir = path.join(process.cwd(), 'content','posts');
  if(!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f=>f.endsWith('.mdx'));
  return files.map(f=> ({ slug: f.replace(/\.mdx$/,''), body: fs.readFileSync(path.join(dir,f),'utf8') }));
}

async function run(){
  console.log('Carregando posts do Sanity...');
  const dbPosts = await fetchSanityPosts();
  const mdxPosts = loadContentlayerMdx();
  console.log(`Sanity posts: ${dbPosts.length} | MDX posts: ${mdxPosts.length}`);

  const texts: { id: string; input: string; meta: any }[] = [];
  for(const p of dbPosts){
    const base = [
      p.title ?? '',
      p.excerpt ?? '',
      p.description ?? '',
      blocksToPlainText(p.content),
    ].filter(Boolean).join('\n\n');
    texts.push({ id: p.id, input: toPlain(base).slice(0,8000), meta: { slug: p.slug, source:'sanity' } });
  }
  for(const m of mdxPosts){
    texts.push({ id: m.slug, input: toPlain(m.body).slice(0,8000), meta: { slug: m.slug, source:'mdx' } });
  }
  if(!texts.length){ console.log('Nada para indexar.'); return; }
  console.log('Gerando embeddings...');
  const vectors = await embed(texts);
  console.log('Upsert no banco...');
  const rows = vectors.map(v=>{
    const entry = texts.find(t=>t.id===v.id)!;
    return { id: v.id, slug: entry.meta.slug, embedding: v.embedding, source: entry.meta.source };
  });
  const dbRows = rows.filter(r=> /[0-9a-f-]{36}/.test(r.id));
  if(dbRows.length) await upsertEmbeddings(dbRows);
  console.log('Concluido. Vetores (db):', dbRows.length);
  if(rows.length !== dbRows.length) console.log('Vetores MDX nao upsertados (precisa de tabela separada ou map):', rows.length - dbRows.length);
}
run().catch(e=> { console.error(e); process.exit(1); });
