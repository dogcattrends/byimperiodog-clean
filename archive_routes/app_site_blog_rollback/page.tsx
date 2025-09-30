import Link from "next/link";
import { supabasePublic } from "@/lib/supabasePublic";
import { Suspense } from "react";
import { getBreadcrumbJsonLd, getSiteJsonLd } from '@/lib/jsonld';
import type { Metadata } from "next";
import { baseBlogMetadata } from '@/lib/seo.core';
import SeoJsonLd from "@/components/SeoJsonLd";
import PostCard from "@/components/blog/PostCard";
import Breadcrumbs from "@/components/Breadcrumbs";

type PostListItem = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  excerpt: string | null;
  published_at: string | null;
};

export const revalidate = 60;

export async function generateMetadata({ searchParams }: { searchParams?: { page?: string; q?: string; tag?: string } }): Promise<Metadata> {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');
  const params = new URLSearchParams();
  const q = searchParams?.q?.trim();
  const tag = searchParams?.tag?.trim();
  const rawPage = Number(searchParams?.page || '1') || 1;
  if (q) params.set('q', q);
  if (tag) params.set('tag', tag);
  if (rawPage > 1) params.set('page', String(rawPage));
  const path = params.toString() ? `/blog?${params.toString()}` : '/blog';
  const canonical = `${origin}${path}`;
  const robots = rawPage > 1 ? { index: false, follow: true } : undefined;
  // prev / next (somente em paginação)
  const makeUrl = (p: number) => {
    const up = new URLSearchParams();
    if (q) up.set('q', q);
    if (tag) up.set('tag', tag);
    if (p > 1) up.set('page', String(p));
    return `${origin}/blog${up.toString() ? `?${up.toString()}` : ''}`;
  };
  const prev = rawPage > 1 ? makeUrl(rawPage - 1) : undefined;
  const next = makeUrl(rawPage + 1);

  const dynamicTitleParts: string[] = [];
  if (q) dynamicTitleParts.push(`Busca: “${q}”`);
  if (tag) dynamicTitleParts.push(`Tag: ${tag}`);
  if (rawPage > 1) dynamicTitleParts.push(`Página ${rawPage}`);
  const dynamicPrefix = dynamicTitleParts.length ? dynamicTitleParts.join(' · ') + ' | ' : '';

  return baseBlogMetadata({
  title: `${dynamicPrefix}Blog | By Imperio Dog`,
    alternates: { canonical },
    robots,
  openGraph: { url: canonical, title: `${dynamicPrefix}Blog | By Imperio Dog` },
    other: {
      ...(prev ? { 'link:prev': prev } : {}),
      ...(next ? { 'link:next': next } : {}),
    },
  });
}

export default async function Blog({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string; tag?: string };
}) {
  const pageSize = 12;
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const q = (searchParams?.q || "").trim();
  const tag = (searchParams?.tag || "").trim().toLowerCase();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sb = supabasePublic();

  let query = sb
    .from("blog_posts")
    .select("id,slug,title,cover_url,excerpt,published_at,reading_time", { count: "exact" })
    .eq("status", "published");

  if (q) {
    const term = q.replace(/[,]/g, " ");
    query = query.or(
      `title.ilike.%${term}%,excerpt.ilike.%${term}%,subtitle.ilike.%${term}%`
    );
  }

  if (tag) {
    const { data: tagRows } = await sb
      .from("blog_tags")
      .select("id,slug,name")
      .or(`slug.eq.${tag},name.ilike.%${tag}%`)
      .limit(1);
    const tagId = tagRows?.[0]?.id as string | undefined;
    if (tagId) {
      const { data: links } = await sb
        .from("blog_post_tags")
        .select("post_id")
        .eq("tag_id", tagId)
        .limit(1000);
      const ids = (links || []).map((l: any) => l.post_id);
      if (ids.length === 0) {
        return (
          <main className="mx-auto max-w-6xl px-6 py-10 text-zinc-900">
            <header className="mb-6">
              <h1 className="text-3xl font-extrabold leading-tight">Blog By Imperio Dog</h1>
              <p className="mt-1 text-zinc-600">Nenhum post encontrado para a tag “{tag}”.</p>
              <Link href={`/blog?${q ? `q=${encodeURIComponent(q)}&` : ""}page=1`} className="mt-3 inline-block rounded border px-3 py-1 text-sm">
                Limpar filtro
              </Link>
            </header>
          </main>
        );
      }
      query = query.in("id", ids);
    }
  }

  const { data, count, error } = await query.order("published_at", { ascending: false }).range(from, to);
  if (error) {
    return <main className="mx-auto max-w-6xl px-6 py-10"><p className="text-red-600 text-sm">Erro ao carregar posts: {error.message}</p></main>;
  }
  const posts = (data || []) as (PostListItem & { reading_time?: number | null })[];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br';
  const jsonLd = getBreadcrumbJsonLd({ siteUrl, items: [ { name:'Blog', url:'/blog' } ] });
  const siteJson = getSiteJsonLd({ siteUrl, name: 'By Imperio Dog', searchUrl: `${siteUrl}/search` });
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: posts.slice(0, 12).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${siteUrl}/blog/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-[var(--text)]">
      {/* prev/next link tags removidos no App Router; mantidos em generateMetadata via 'other' */}
      <Breadcrumbs className="mb-3" items={[{ label: 'Início', href: '/' }, { label: 'Blog' }]} />
  <header className="mb-6">
  <h1 className="text-3xl font-extrabold leading-tight">Blog By Imperio Dog</h1>
    <p className="mt-1 text-[var(--text-muted)]">Conteúdo sobre Spitz Alemão, bem-estar e novidades.</p>
  <SeoJsonLd data={siteJson} />
  <SeoJsonLd data={jsonLd} />
  <SeoJsonLd data={itemList} />
        <form className="mt-4 flex gap-2" action="/blog" method="get">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por título ou resumo"
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-muted)] sm:w-96 focus-visible:focus-ring"
          />
          <input type="hidden" name="page" value="1" />
          {tag && <input type="hidden" name="tag" value={tag} />}
          <button className="btn-outline">Buscar</button>
        </form>
        {tag && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="badge-neutral">Tag: {tag}</span>
            <Link
              href={`/blog?${q ? `q=${encodeURIComponent(q)}&` : ""}page=1`}
              className="text-[var(--text-muted)] underline focus-visible:focus-ring"
            >
              Limpar tag
            </Link>
          </div>
        )}
      </header>

      {posts.length === 0 ? (
  <div className="text-[var(--text-muted)] text-sm space-y-2">
          <p>Nenhum post publicado ainda.</p>
          <p className="text-xs">Verifique se você marcou status = published no painel admin ou se o campo published_at foi gravado.</p>
        </div>
      ) : (
  <Suspense fallback={<p className="text-sm text-[var(--text-muted)]">Carregando...</p>}>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                href={`/blog/${p.slug}`}
                title={p.title}
                coverUrl={p.cover_url}
                excerpt={p.excerpt}
                date={p.published_at}
                readingTime={(p as any).reading_time || null}
              />
            ))}
          </ul>
        </Suspense>
      )}

      <div className="mt-8 flex items-center justify-between">
        {page > 1 ? (
          <Link
            href={`/blog?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${
              tag ? `&tag=${encodeURIComponent(tag)}` : ""
            }`}
            className="btn-outline text-sm px-3 py-1"
          >
            ← Anterior
          </Link>
        ) : (
          <span />
        )}
        {typeof count === "number" && page * pageSize < count ? (
          <Link
            href={`/blog?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${
              tag ? `&tag=${encodeURIComponent(tag)}` : ""
            }`}
            className="btn-outline text-sm px-3 py-1"
          >
            Próxima →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </main>
  );
}
