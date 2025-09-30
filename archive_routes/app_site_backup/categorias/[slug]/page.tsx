import { supabasePublic } from '@/lib/supabasePublic';
import Link from 'next/link';
import SeoJsonLd from '@/components/SeoJsonLd';
import { getBreadcrumbJsonLd } from '@/lib/jsonld';
import type { Metadata } from 'next';
import { canonical, baseBlogMetadata } from '@/lib/seo.core';

export const revalidate = 120;

export async function generateMetadata({ params }: { params:{ slug:string } }): Promise<Metadata>{
  const raw = decodeURIComponent(params.slug);
  const title = `Categoria: ${raw} | By Imperio Dog`;
  const url = canonical(`/categorias/${encodeURIComponent(raw)}`);
  return baseBlogMetadata({
    title,
    description: `Artigos na categoria ${raw} sobre Spitz Alemão e bem-estar.`,
    alternates: { canonical: url },
    openGraph: { url, title },
  });
}

export default async function CategoriaPage({ params, searchParams }: { params:{ slug:string }; searchParams?:{ page?:string }} ){
  const slug = decodeURIComponent(params.slug);
  const pageSize = 12; const page = Math.max(1, Number(searchParams?.page||1)||1);
  const from=(page-1)*pageSize; const to=from+pageSize-1;
  const sb = supabasePublic();
  const { data: cat } = await sb.from('blog_categories').select('id,slug,name').or(`slug.eq.${slug},name.ilike.%${slug}%`).maybeSingle();
  if(!cat) return <main className="mx-auto max-w-6xl px-6 py-10"><h1 className="text-2xl font-bold">Categoria não encontrada</h1><Link href="/blog" className="mt-4 inline-block underline text-sm">Voltar</Link></main>;
  const { data: links } = await sb.from('blog_post_categories').select('post_id').eq('category_id', cat.id).limit(1000);
  const ids = (links||[]).map((l:any)=> l.post_id);
  let posts:any[]=[]; let count=0;
  if(ids.length){
    const { data, count: c } = await sb.from('blog_posts').select('id,slug,title,excerpt,cover_url,published_at',{ count:'exact' }).eq('status','published').in('id', ids).order('published_at',{ ascending:false }).range(from,to);
    posts=data||[]; count=c||0;
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br';
  const crumbs = getBreadcrumbJsonLd({ siteUrl, items: [ { name:'Blog', url:'/blog' }, { name:`Categoria: ${cat.name}`, url:`/categorias/${encodeURIComponent(cat.slug)}` } ] });
  const itemList = {
    '@context':'https://schema.org',
    '@type':'ItemList',
    itemListElement: posts.slice(0,12).map((p:any,i:number)=> ({ '@type':'ListItem', position:i+1, name:p.title, url:`${siteUrl}/blog/${p.slug}` }))
  };
  return <main className="mx-auto max-w-6xl px-6 py-10">
    <SeoJsonLd data={crumbs} />
    <SeoJsonLd data={itemList} />
    <header className="mb-6"><h1 className="text-3xl font-extrabold">Categoria: {cat.name}</h1><p className="mt-1 text-zinc-600">Artigos segmentados por tema.</p></header>
    {posts.length? <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map(p=> <li key={p.id} className="rounded-xl border bg-white shadow-sm p-4"><Link href={`/blog/${p.slug}`} className="font-semibold line-clamp-2 hover:underline">{p.title}</Link><p className="mt-1 text-sm text-zinc-600 line-clamp-3">{p.excerpt||''}</p><p className="mt-2 text-[11px] text-zinc-500">{p.published_at? new Date(p.published_at).toLocaleDateString('pt-BR'):''}</p></li>)}</ul>: <p className="text-zinc-600">Nenhum post nesta categoria.</p>}
    <div className="mt-8 flex justify-between">{page>1? <Link href={`/categorias/${encodeURIComponent(cat.slug)}?page=${page-1}`} className="rounded border px-3 py-1 text-sm">← Anterior</Link>: <span/>}{page*pageSize < count? <Link href={`/categorias/${encodeURIComponent(cat.slug)}?page=${page+1}`} className="rounded border px-3 py-1 text-sm">Próxima →</Link>: <span/>}</div>
  </main>;
}
