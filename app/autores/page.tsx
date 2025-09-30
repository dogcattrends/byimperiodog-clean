import { supabasePublic } from '@/lib/supabasePublic';
import Link from 'next/link';
import type { Metadata } from 'next';
import SeoJsonLd from '@/components/SeoJsonLd';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getBreadcrumbJsonLd } from '@/lib/jsonld';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br';
  return {
    title: 'Autores — By Imperio Dog',
    description: 'Conheça os autores do blog By Imperio Dog e descubra seus artigos.',
    alternates: { canonical: `${siteUrl.replace(/\/$/, '')}/autores` },
    openGraph: {
      url: `${siteUrl.replace(/\/$/, '')}/autores`,
      title: 'Autores — By Imperio Dog',
      description: 'Conheça os autores do blog By Imperio Dog e descubra seus artigos.',
      siteName: 'By Imperio Dog'
    }
  };
}

export default async function AutoresIndex(){
  const sb = supabasePublic();
  const { data } = await sb.from('blog_authors').select('id,name,slug,avatar_url,bio').order('name');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br';
  const breadcrumbLd = getBreadcrumbJsonLd({ siteUrl, items: [ { name: 'Blog', url: '/blog' }, { name: 'Autores', url: '/autores' } ] });
  type AuthorRow = { id:string; name:string; slug:string; avatar_url:string|null; bio:string|null };
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
  itemListElement: (data as AuthorRow[] | null || []).map((a:AuthorRow, idx:number) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${siteUrl.replace(/\/$/, '')}/autores/${a.slug}`,
      item: {
        '@type': 'Person',
        name: a.name,
        url: `${siteUrl.replace(/\/$/, '')}/autores/${a.slug}`,
        image: a.avatar_url || undefined,
        description: a.bio || undefined
      }
    }))
  } as const;

  return <main className="mx-auto max-w-6xl px-6 py-10 text-[var(--text)]">
    <SeoJsonLd data={breadcrumbLd} />
    <SeoJsonLd data={itemListLd as any} />
    <Breadcrumbs className="mb-4" items={[{ label: 'Início', href: '/' }, { label: 'Blog', href: '/blog' }, { label: 'Autores' }]} />
    <h1 className="text-3xl font-extrabold mb-6">Autores</h1>
{data && data.length? <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{(data as AuthorRow[]).map((a:AuthorRow)=> <li key={a.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <Link href={`/autores/${a.slug}`} className="font-semibold hover:underline focus-visible:focus-ring">{a.name}</Link>
      {a.bio && <p className="mt-1 text-sm text-[var(--text-muted)] line-clamp-3">{a.bio}</p>}
    </li>)}</ul>: <p className="text-[var(--text-muted)]">Nenhum autor cadastrado.</p>}
  </main>;
}
