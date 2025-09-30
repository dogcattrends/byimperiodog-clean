import { supabasePublic } from '@/lib/supabasePublic';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import type { Metadata } from 'next';
import SeoJsonLd from '@/components/SeoJsonLd';
import { buildAuthorJsonLd } from '@/lib/seo.core';

export const revalidate = 120;

export async function generateMetadata({ params, searchParams }: { params:{ slug:string }, searchParams?:{ page?:string } }): Promise<Metadata>{
  const slug = decodeURIComponent(params.slug);
  const name = slug.replace(/-/g,' ');
  const title = `Autor: ${name} | By Imperio Dog`;
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br';
  const pageNum = Math.max(1, Number(searchParams?.page||'1')||1);
  const base = `${site}/autores/${encodeURIComponent(slug)}`;
  const canonical = pageNum>1? `${base}?page=${pageNum}` : base;
  const robots = pageNum>1? { index:false, follow:true } : undefined;
  const prev = pageNum>1? `${base}?page=${pageNum-1}`: undefined;
  const next = `${base}?page=${pageNum+1}`;
  return { title, description:`Conteúdos escritos por ${name}.`, alternates:{ canonical }, robots, openGraph:{ title, url: canonical }, other:{ ...(prev? { 'link:prev': prev }: {}), 'link:next': next } };
}

export default async function AutorPage({ params, searchParams }: { params:{ slug:string }; searchParams?:{ page?:string }} ){
  const slug = decodeURIComponent(params.slug);
  const pageSize = 12; const page = Math.max(1, Number(searchParams?.page||1)||1);
  const from=(page-1)*pageSize; const to=from+pageSize-1;
  const sb = supabasePublic();
  const { data: author } = await sb.from('blog_authors').select('id,name,bio,avatar_url,slug').eq('slug', slug).maybeSingle();
  if(!author) return <main className="mx-auto max-w-6xl px-6 py-10"><h1 className="text-2xl font-bold">Autor não encontrado</h1><Link href="/blog" className="mt-4 inline-block underline text-sm">Voltar</Link></main>;
  const { data: posts, count } = await sb.from('blog_posts').select('id,slug,title,excerpt,cover_url,published_at',{ count:'exact' }).eq('author_id', author.id).eq('status','published').order('published_at',{ ascending:false }).range(from,to);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br';
  const jsonLdBreadcrumb = { '@context':'https://schema.org', '@type':'BreadcrumbList', itemListElement:[ { '@type':'ListItem', position:1, name:'Blog', item: `${siteUrl}/blog` }, { '@type':'ListItem', position:2, name:`Autor: ${author.name}`, item: `${siteUrl}/autores/${encodeURIComponent(author.slug)}` } ] };
  const jsonLdAuthor = buildAuthorJsonLd({ name: author.name, slug: author.slug, avatar_url: author.avatar_url, bio: author.bio||undefined });
  const itemList = { '@context':'https://schema.org', '@type':'ItemList', itemListElement: (posts||[]).map((p: any, i: number)=> ({ '@type':'ListItem', position:i+1, url:`${siteUrl}/blog/${p.slug}`, name:p.title })) };
  const prevHref = page>1? `/autores/${encodeURIComponent(author.slug)}?page=${page-1}`: undefined;
  const nextHref = typeof count==='number' && page*pageSize < (count||0)? `/autores/${encodeURIComponent(author.slug)}?page=${page+1}`: undefined;
  return <main className="mx-auto max-w-6xl px-6 py-10 text-[var(--text)]">
    <Head>
      {prevHref && <link rel="prev" href={prevHref} />}
      {nextHref && <link rel="next" href={nextHref} />}
    </Head>
  <header className="mb-6 flex items-start gap-4">
  {author.avatar_url? <Image src={author.avatar_url} alt={author.name} width={80} height={80} className="h-20 w-20 rounded-full object-cover border" />: <div className="h-20 w-20 rounded-full bg-zinc-200"/>}
      <div>
        <h1 className="text-3xl font-extrabold leading-tight">{author.name}</h1>
  {author.bio && <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">{author.bio}</p>}
      </div>
    </header>
  <SeoJsonLd data={jsonLdBreadcrumb} />
  <SeoJsonLd data={jsonLdAuthor} />
    <SeoJsonLd data={itemList} />
  {posts && posts.length? <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((p: any)=> <li key={p.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-4"><Link href={`/blog/${p.slug}`} className="font-semibold line-clamp-2 hover:underline focus-visible:focus-ring">{p.title}</Link><p className="mt-1 text-sm text-[var(--text-muted)] line-clamp-3">{p.excerpt||''}</p><p className="mt-2 text-[11px] text-[var(--text-muted)]">{p.published_at? new Date(p.published_at).toLocaleDateString('pt-BR'):''}</p></li>)}</ul>: <p className="text-[var(--text-muted)]">Nenhum post publicado ainda.</p>}
    <div className="mt-8 flex justify-between">{page>1? <Link href={`/autores/${encodeURIComponent(author.slug)}?page=${page-1}`} className="btn-outline text-sm px-3 py-1">← Anterior</Link>: <span/>}{page*pageSize < (count||0)? <Link href={`/autores/${encodeURIComponent(author.slug)}?page=${page+1}`} className="btn-outline text-sm px-3 py-1">Próxima →</Link>: <span/>}</div>
  </main>;
}
