import type { Metadata } from 'next';
import Link from 'next/link';

import PostCard from '@/components/blog/PostCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import SeoJsonLd from '@/components/SeoJsonLd';
import { getBreadcrumbJsonLd } from '@/lib/jsonld';
import { baseBlogMetadata, canonical } from '@/lib/seo.core';
import { supabasePublic } from '@/lib/supabasePublic';

export const revalidate = 120;

interface PostListItem { id:string; slug:string; title:string; cover_url:string|null; excerpt:string|null; published_at:string|null }
interface CategoryRow { id:string; slug:string; name:string }

export async function generateMetadata({ params, searchParams }: { params:{ slug:string }; searchParams?: { page?:string } }): Promise<Metadata> {
  const raw = decodeURIComponent(params.slug || '');
  const base = canonical(`/blog/categoria/${encodeURIComponent(raw)}`);
  const pageNum = Number(searchParams?.page || '1') || 1;
  const url = pageNum > 1 ? `${base}?page=${pageNum}` : base;
  const robots = pageNum > 1 ? { index:false, follow:true } : undefined; // opcional noindex em paginações profundas
  const prev = pageNum > 1 ? `${base}?page=${pageNum - 1}` : undefined;
  const next = `${base}?page=${pageNum + 1}`;
  const title = `Categoria: ${raw} | By Imperio Dog`;
  return baseBlogMetadata({
    title,
    description: `Artigos na categoria ${raw} sobre Spitz Alemão (Lulu da Pomerânia).`,
    alternates: { canonical: url },
    robots,
    openGraph: { url, title },
    other: { ...(prev ? { 'link:prev': prev } : {}), ...(next ? { 'link:next': next } : {}) },
  });
}

async function resolveCategory(slugOrName:string): Promise<CategoryRow|null> {
  const sb = supabasePublic();
  const { data } = await sb.from('blog_categories').select('id,slug,name').or(`slug.eq.${slugOrName},name.ilike.%${slugOrName}%`).limit(1);
  return (data && data[0]) || null;
}

async function fetchPostsForCategory(catId:string, from:number, to:number) {
  const sb = supabasePublic();
  const { data: links } = await sb.from('blog_post_categories').select('post_id').eq('category_id', catId).limit(1000);
  const ids = (links || [] as { post_id: string }[]).map((l: { post_id: string }) => l.post_id);
  if(!ids.length) return { posts:[], count:0 };
  const r = await sb.from('blog_posts')
    .select('id,slug,title,cover_url,excerpt,published_at', { count:'exact' })
    .eq('status','published')
    .in('id', ids)
    .order('published_at', { ascending:false })
    .range(from,to);
  return { posts: (r.data||[]) as PostListItem[], count: r.count||0 };
}

export default async function BlogCategoriaPage({ params, searchParams }: { params:{ slug:string }; searchParams?: { page?:string } }) {
  const pageSize = 12;
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const raw = decodeURIComponent(params.slug || '').trim().toLowerCase();
  const category = await resolveCategory(raw);
  if(!category){
    return <main className="mx-auto max-w-6xl px-6 py-10 text-zinc-900"><h1 className="text-3xl font-extrabold leading-tight">Categoria não encontrada</h1><Link href="/blog" className="mt-4 inline-block rounded border px-3 py-1 text-sm">Voltar</Link></main>;
  }
  const { posts, count } = await fetchPostsForCategory(category.id, from, to);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br';
  const crumbs = getBreadcrumbJsonLd({ siteUrl, items:[ { name:'Blog', url:'/blog' }, { name:`Categoria: ${category.name}`, url:`/blog/categoria/${encodeURIComponent(category.slug)}` } ] });
  const itemList = {
    '@context':'https://schema.org',
    '@type':'ItemList',
    itemListElement: posts.slice(0,12).map((p,i)=> ({ '@type':'ListItem', position:i+1, name:p.title, url:`${siteUrl}/blog/${p.slug}` }))
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-zinc-900">
      <Breadcrumbs className="mb-3" items={[{ label:'Início', href:'/' }, { label:'Blog', href:'/blog' }, { label:`Categoria: ${category.name}` }]} />
      <SeoJsonLd data={crumbs} />
      <SeoJsonLd data={itemList} />
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold leading-tight">Categoria: {category.name}</h1>
        <p className="mt-1 text-zinc-600">Artigos agrupados por tema específico.</p>
        <div className="mt-3"><Link href="/blog/categorias" className="text-zinc-600 underline">Ver todas categorias</Link></div>
      </header>
      {posts.length === 0 ? (
        <p className="text-zinc-600">Nenhum post publicado nesta categoria.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(p => (
            <PostCard key={p.id} href={`/blog/${p.slug}`} title={p.title} coverUrl={p.cover_url} excerpt={p.excerpt} date={p.published_at} readingTime={null} />
          ))}
        </ul>
      )}
      <div className="mt-8 flex items-center justify-between">
        {page > 1 ? (
          <Link href={`/blog/categoria/${encodeURIComponent(category.slug)}?page=${page-1}`} className="rounded border px-3 py-1 text-sm">Anterior</Link>
        ) : <span />}
        {typeof count === 'number' && page * pageSize < count ? (
          <Link href={`/blog/categoria/${encodeURIComponent(category.slug)}?page=${page+1}`} className="rounded border px-3 py-1 text-sm">Próxima</Link>
        ) : <span />}
      </div>
    </main>
  );
}
