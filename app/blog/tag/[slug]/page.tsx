import Link from "next/link";
import { supabasePublic } from "@/lib/supabasePublic";
import type { Metadata } from "next";
import { baseBlogMetadata, canonical } from '@/lib/seo.core';
import PostCard from "@/components/blog/PostCard";
import SeoJsonLd from "@/components/SeoJsonLd";
import { getBreadcrumbJsonLd } from "@/lib/jsonld";
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

export async function generateMetadata({ params, searchParams }: { params: { slug: string }, searchParams?: { page?: string } }): Promise<Metadata> {
  const raw = decodeURIComponent(params.slug || '');
  const base = canonical(`/blog/tag/${encodeURIComponent(raw)}`);
  const pageNum = Number(searchParams?.page || '1') || 1;
  const url = pageNum > 1 ? `${base}?page=${pageNum}` : base;
  const robots = pageNum > 1 ? { index: false, follow: true } : undefined;
  const prev = pageNum > 1 ? `${base}?page=${pageNum - 1}` : undefined;
  const next = `${base}?page=${pageNum + 1}`;
  const title = `Blog por tag: ${raw} | By Imperio Dog`;
  return baseBlogMetadata({
    title,
    description: `Artigos sobre ${raw} com foco em Spitz Alemão (Lulu da Pomerânia).`,
    alternates: { canonical: url },
    robots,
    openGraph: { url, title },
    other: { ...(prev ? { 'link:prev': prev } : {}), ...(next ? { 'link:next': next } : {}) },
  });
}

export default async function BlogTagPage({ params, searchParams }: { params: { slug: string }; searchParams?: { page?: string } }) {
  const pageSize = 12;
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const tag = decodeURIComponent(params.slug || "").trim().toLowerCase();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sb = supabasePublic();

  // resolve tag id
  const { data: tagRows } = await sb
    .from("blog_tags")
    .select("id,slug,name")
    .or(`slug.eq.${tag},name.ilike.%${tag}%`)
    .limit(1);
  const tagId = tagRows?.[0]?.id as string | undefined;

  if (!tagId) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10 text-zinc-900">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold leading-tight">Blog: tag não encontrada</h1>
          <Link href="/blog" className="mt-3 inline-block rounded border px-3 py-1 text-sm">Voltar ao Blog</Link>
        </header>
      </main>
    );
  }

  // posts linked to tag
  const { data: links } = await sb
    .from("blog_post_tags")
    .select("post_id")
    .eq("tag_id", tagId)
    .limit(1000);
  const ids = (links || []).map((l: any) => l.post_id);

  let posts: PostListItem[] = [];
  let count: number | null = 0;
  if (ids.length) {
    const q = sb
      .from("blog_posts")
      .select("id,slug,title,cover_url,excerpt,published_at", { count: "exact" })
      .eq("status", "published")
      .in("id", ids)
      .order("published_at", { ascending: false })
      .range(from, to);
    const r = await q;
    posts = (r.data || []) as PostListItem[];
    count = r.count || 0;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-zinc-900">
      {/* prev/next link tags removidos no App Router; mantidos em generateMetadata via 'other' */}
  <Breadcrumbs className="mb-3" items={[{ label: 'Início', href: '/' }, { label: 'Blog', href: '/blog' }, { label: `Tag: ${tag}` }]} />
      {(() => {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br';
        const crumbs = getBreadcrumbJsonLd({ siteUrl, items: [ { name: 'Blog', url: '/blog' }, { name: `Tag: ${tag}`, url: `/blog/tag/${encodeURIComponent(tag)}` } ] });
        const itemList = {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: posts.slice(0, 12).map((p, i) => ({
            '@type': 'ListItem', position: i + 1, url: `${siteUrl}/blog/${p.slug}`, name: p.title,
          })),
        };
        return <>
          <SeoJsonLd data={crumbs} />
          <SeoJsonLd data={itemList} />
        </>;
      })()}
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold leading-tight">Blog por tag: {tag}</h1>
        <p className="mt-1 text-zinc-600">Conteúdo sobre Spitz Alemão (Lulu da Pomerânia).</p>
        <div className="mt-3">
          <Link href="/blog" className="text-zinc-600 underline">Ver todos</Link>
        </div>
      </header>

      {posts.length === 0 ? (
        <p className="text-zinc-600">Nenhum post publicado nesta tag.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              href={`/blog/${p.slug}`}
              title={p.title}
              coverUrl={p.cover_url}
              excerpt={p.excerpt}
              date={p.published_at}
              readingTime={null}
            />
          ))}
        </ul>
      )}

      <div className="mt-8 flex items-center justify-between">
        {page > 1 ? (
          <Link href={`/blog/tag/${encodeURIComponent(tag)}?page=${page - 1}`} className="rounded border px-3 py-1 text-sm">Anterior</Link>
        ) : <span />}
        {typeof count === "number" && page * pageSize < count ? (
          <Link href={`/blog/tag/${encodeURIComponent(tag)}?page=${page + 1}`} className="rounded border px-3 py-1 text-sm">Próxima</Link>
        ) : <span />}
      </div>
    </main>
  );
}
