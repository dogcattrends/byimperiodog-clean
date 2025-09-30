import React from 'react';
import Link from 'next/link';
import { supabaseAnon } from '@/lib/supabaseAnon';
import { estimateReadingTime } from '@/lib/blog/reading-time';

interface PublicPost { id:string; slug:string; title:string; excerpt?:string|null; cover_url?:string|null; cover_alt?:string|null; published_at?:string|null; content_mdx?:string|null; }

async function fetchPosts():Promise<PublicPost[]> {
  try {
    const sb = supabaseAnon();
    const { data, error } = await sb.from('blog_posts').select('id,slug,title,excerpt,cover_url,cover_alt,published_at,content_mdx,status').eq('status','published').order('published_at',{ascending:false}).limit(48);
    if(error) throw error; return data as any || [];
  } catch { return []; }
}

export const revalidate = 300; // cache leve

export const metadata = { title: 'Blog', description: 'Artigos e guias sobre cuidados, saúde e bem-estar do seu Spitz Alemão.' };

export default async function BlogListPage(){
  const posts = await fetchPosts();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="mt-2 text-[var(--text-muted)] max-w-xl">Guias, dicas e insights para oferecer a melhor experiência ao seu cão.</p>
        </div>
      </header>
      {posts.length === 0 && <p className="text-sm text-[var(--text-muted)]">Nenhum artigo publicado ainda.</p>}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {posts.map(p=>{
          const minutes = p.content_mdx? estimateReadingTime(p.content_mdx) : null;
          return (
            <li key={p.id} className="group relative flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2">
              <Link href={`/blog/${p.slug}`} className="absolute inset-0" aria-label={p.title} tabIndex={-1}></Link>
              <div className="aspect-[16/9] w-full overflow-hidden bg-[var(--surface-2)]">
                {p.cover_url? <img src={p.cover_url} alt={p.cover_alt||''} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />: <div className="flex h-full w-full items-center justify-center text-xs text-[var(--text-muted)]">Sem capa</div>}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="mb-2 line-clamp-2 text-base font-semibold leading-snug text-[var(--text)] group-hover:underline underline-offset-4">{p.title}</h2>
                {p.excerpt && <p className="mb-3 line-clamp-3 text-xs text-[var(--text-muted)]">{p.excerpt}</p>}
                <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-[var(--text-muted)]">
                  <span>{p.published_at? new Date(p.published_at).toLocaleDateString('pt-BR'): ''}</span>
                  {minutes && <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-medium text-[10px]">{minutes} min</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
