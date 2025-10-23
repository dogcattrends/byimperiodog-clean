import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import React from 'react';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import BlogCTAs from '@/components/blog/BlogCTAs';
import Comments from '@/components/blog/Comments';
import PostCard from '@/components/blog/PostCard';
import Prose from '@/components/blog/Prose';
import ReadingProgress from '@/components/blog/ReadingProgress';
import ScrollAnalytics from '@/components/blog/ScrollAnalytics';
import ShareButtons from '@/components/blog/ShareButtons';
import TocNav from '@/components/blog/Toc';
import Breadcrumbs from '@/components/Breadcrumbs';
import { mdxComponents } from '@/components/MDXContent';
import SeoJsonLd from '@/components/SeoJsonLd';
import { compileBlogMdx } from '@/lib/blog/mdx/compile';
import { estimateReadingTime } from '@/lib/blog/reading-time';
import { getRelatedUnified } from '@/lib/blog/related';
import { buildBlogMetadata, buildArticleJsonLd } from '@/lib/blog/seo';
import { supabaseAnon } from '@/lib/supabaseAnon';

interface Post { id:string; slug:string; title:string; subtitle?:string|null; excerpt?:string|null; content_mdx?:string|null; cover_url?:string|null; cover_alt?:string|null; published_at?:string|null; created_at?:string|null; updated_at?:string|null; status?:string|null; author_id?:string|null; seo_title?:string|null; seo_description?:string|null; category?:string|null; tags?:string[]|null; lang?:string|null; }
interface Author { name:string; slug:string; avatar_url?:string|null }
interface RelatedAny { slug:string; title:string; excerpt?:string|null; published_at?:string|null; cover_url?:string|null }
type MDXComponentsMap = Record<string, React.ComponentType<Record<string, unknown>>>;

async function fetchPost(slug:string, opts:{ preview:boolean }):Promise<Post|null>{
  try {
    const sb = supabaseAnon();
    const { data, error } = await sb
      .from('blog_posts')
      .select('id,slug,title,subtitle,excerpt,content_mdx,cover_url,cover_alt,published_at,created_at,updated_at,status,author_id,seo_title,seo_description,category,tags,lang')
      .eq('slug', slug)
      .maybeSingle();
  if(error) throw error; if(!data) return null;
  if(data.status === 'published') return data as Post;
  if(opts.preview && (data.status === 'review' || data.status === 'draft')) return data as Post;
  return null;
  } catch { return null; }
}

async function fetchAuthor(authorId: string | null | undefined):Promise<Author|null>{
  if(!authorId) return null;
  try {
    const sb = supabaseAnon();
  const { data } = await sb.from('blog_authors').select('name,slug,avatar_url').eq('id', authorId).maybeSingle();
  return (data as Author) || null;
  } catch { return null; }
}

export async function generateStaticParams(){ return []; }
export const revalidate = 300;

// (substituído por deriveExcerpt do helper seo)

export async function generateMetadata({ params, searchParams }:{ params:{ slug:string }, searchParams?:{ preview?: string } }){
  const preview = process.env.NODE_ENV !== 'production' && searchParams?.preview === '1';
  const p = await fetchPost(params.slug, { preview });
  if(!p) return {};
  // canonical já definido dentro de buildBlogMetadata
  return buildBlogMetadata(p as unknown as Post & { content_mdx?: string | null });
}

// JSON-LD agora via buildArticleJsonLd

export default async function BlogPostPage({ params, searchParams }:{ params:{ slug:string }, searchParams?:{ preview?: string } }){
  const preview = process.env.NODE_ENV !== 'production' && searchParams?.preview === '1';
  const post = await fetchPost(params.slug, { preview });
  if(!post) return notFound();
  const author = await fetchAuthor(post.author_id);
  const compiled = post.content_mdx ? await compileBlogMdx(post.content_mdx) : null;
  const minutes = compiled?.readingTimeMinutes || estimateReadingTime(post.content_mdx||'');
  const related = await getRelatedUnified(post.slug, 6) as RelatedAny[];
  const { article, breadcrumb, faqBlock } = buildArticleJsonLd(post as unknown as Post & { content_mdx?: string|null }, author, { toc: compiled?.toc });

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-10">
      <ReadingProgress />
      {preview && post.status !== 'published' && (
        <div className="mb-6 rounded-md border border-amber-400 bg-amber-50 p-3 text-amber-800 text-sm dark:border-amber-500 dark:bg-amber-900/20 dark:text-amber-200 flex flex-wrap gap-3 items-center">
          <span className="font-medium">Pré-visualização:</span>
          <span>Status atual: <strong>{post.status}</strong></span>
          <PublishButton slug={post.slug} />
          <a href={`/blog/${post.slug}`} className="underline decoration-dotted">
            Sair do modo preview
          </a>
        </div>
      )}
      <Breadcrumbs className="mb-6" items={[{ label: 'Início', href: '/' }, { label: 'Blog', href: '/blog' }, { label: post.title }]} />
      <SeoJsonLd data={article} />
      <SeoJsonLd data={breadcrumb} />
      {faqBlock && <SeoJsonLd data={faqBlock} />}
      <div className="flex flex-col xl:flex-row gap-10">
        <article className="flex-1 min-w-0">
          <header className="mb-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
              {post.published_at && (
                <time dateTime={post.published_at} className="font-medium">
                  {new Date(post.published_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
              )}
              <span aria-hidden="true">•</span>
              <span className="font-medium">{minutes} min de leitura</span>
              {author && (
                <>
                  <span aria-hidden="true">•</span>
                  <a href={`/autores/${author.slug}`} className="font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    {author.name}
                  </a>
                </>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-[var(--text)]">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="text-xl md:text-2xl text-[var(--text-muted)] max-w-prose leading-relaxed">
                {post.subtitle}
              </p>
            )}
          </header>
          {post.cover_url && (
            <figure className="mb-10 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
              <Image src={post.cover_url} alt={post.cover_alt||post.title} width={1280} height={720} className="aspect-[16/9] w-full object-cover" priority />
            </figure>
          )}
          
          {/* Botões de compartilhamento */}
          <div className="mb-8 flex items-center justify-between border-y border-[var(--border)] py-4">
            <ShareButtons 
              title={post.title} 
              url={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/blog/${post.slug}`} 
            />
          </div>

          <Prose>
            {post.content_mdx? (
              <MDXRemote
                source={post.content_mdx}
                components={mdxComponents as MDXComponentsMap}
                options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings] } }}
              />
            ): <p className="italic text-[var(--text-muted)]">(Sem conteúdo)</p>}
          </Prose>
          {/* CTAs estratégicos */}
          <BlogCTAs postTitle={post.title} category={post.category} />

          {/* Sistema de comentários */}
          <div className="mt-16 border-t border-[var(--border)] pt-12">
            <Comments postId={post.id} />
          </div>

          {related?.length>0 && (
            <aside className="mt-20 border-t border-[var(--border)] pt-12">
              <h2 className="mb-6 text-2xl font-bold text-[var(--text)]">
                Artigos relacionados
              </h2>
              <ul className="grid gap-6 sm:grid-cols-2">
                {related.slice(0,4).map(r=> (
                  <PostCard
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    title={r.title}
                    coverUrl={r.cover_url}
                    excerpt={r.excerpt}
                    date={r.published_at}
                    readingTime={null}
                  />
                ))}
              </ul>
            </aside>
          )}
        </article>
        <div className="shrink-0">
          {compiled?.toc && <TocNav toc={compiled.toc} />}
        </div>
      </div>
      <ScrollAnalytics postId={post.id} readingTimeMin={minutes} />
    </div>
  );
}

function PublishButton({ slug }: { slug: string }) {
  // Client component inline (small) via use client directive
  return (
    <form
      action={async () => {
        'use server';
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/admin/blog/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': process.env.ADMIN_TOKEN || process.env.DEBUG_TOKEN || ''
          },
          body: JSON.stringify({ slug })
        });
        // Best effort revalidate (Next 14 server action supports revalidatePath)
        // Import lazy to avoid top-level dependency if not needed.
        try {
          const mod = await import('next/cache');
          mod.revalidatePath(`/blog/${slug}`);
          mod.revalidatePath('/blog');
  } catch { /* noop revalidate fallback */ }
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white shadow hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 dark:focus:ring-offset-slate-900"
      >
        Publicar agora
      </button>
    </form>
  );
}
