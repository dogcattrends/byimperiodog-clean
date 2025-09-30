import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAnon } from '@/lib/supabaseAnon';
import { estimateReadingTime } from '@/lib/blog/reading-time';
import { getRelatedUnified } from '@/lib/blog/related';

interface Post { id:string; slug:string; title:string; subtitle?:string|null; excerpt?:string|null; content_mdx?:string|null; cover_url?:string|null; cover_alt?:string|null; published_at?:string|null; created_at?:string|null; status?:string|null; }

async function fetchPost(slug:string):Promise<Post|null>{
  try {
    const sb = supabaseAnon();
    const { data, error } = await sb.from('blog_posts').select('*').eq('slug', slug).maybeSingle();
    if(error) throw error; if(!data || data.status!=='published') return null; return data as any;
  } catch { return null; }
}

export async function generateStaticParams(){ return []; }
export const revalidate = 300;

export async function generateMetadata({ params }:{ params:{ slug:string } }){
  const p = await fetchPost(params.slug);
  if(!p) return {};
  return { title: p.title, description: p.excerpt || p.subtitle || undefined };
}

function renderMDXPlain(text:string){
  // Fallback simples: converte markdown muito básico em HTML-like elementos
  const blocks = text.split(/\n{2,}/).filter(Boolean);
  return blocks.map((blk, i)=>{
    const heading = blk.match(/^#\s+(.*)/);
    if(heading){ const id = heading[1].toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-'); return <h2 key={i} id={id} className="scroll-mt-24 text-xl font-bold tracking-tight mt-8 first:mt-0">{heading[1]}</h2>; }
    return <p key={i} className="leading-relaxed text-[15px]">{blk}</p>;
  });
}

export default async function BlogPostPage({ params }:{ params:{ slug:string } }){
  const post = await fetchPost(params.slug);
  if(!post) return notFound();
  const minutes = estimateReadingTime(post.content_mdx||'');
  const related = await getRelatedUnified(post.slug, 6);
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
          {post.published_at && <time dateTime={post.published_at}>{new Date(post.published_at).toLocaleDateString('pt-BR')}</time>}
          <span aria-hidden="true">•</span>
          <span>{minutes} min leitura</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight leading-tight mb-3">{post.title}</h1>
        {post.subtitle && <p className="text-lg text-[var(--text-muted)] max-w-prose">{post.subtitle}</p>}
      </header>
      {post.cover_url && (
        <figure className="mb-10 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
          <img src={post.cover_url} alt={post.cover_alt||''} className="aspect-[16/9] w-full object-cover" loading="eager" fetchPriority="high" />
        </figure>
      )}
      <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
        {post.content_mdx? renderMDXPlain(post.content_mdx): <p className="italic text-[var(--text-muted)]">(Sem conteúdo)</p>}
      </div>
      {related?.length>0 && (
        <aside className="mt-16 border-t border-[var(--border)] pt-10">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-[var(--text-muted)]">Artigos relacionados</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {related.slice(0,4).map(r=> (
              <li key={r.slug} className="group rounded border border-[var(--border)] bg-[var(--surface)] p-4 hover:shadow-sm transition">
                <a href={`/blog/${r.slug}`} className="block focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
                  <span className="line-clamp-2 text-sm font-medium group-hover:underline">{r.title}</span>
                  {r.excerpt && <span className="mt-1 block line-clamp-2 text-[11px] text-[var(--text-muted)]">{r.excerpt}</span>}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
