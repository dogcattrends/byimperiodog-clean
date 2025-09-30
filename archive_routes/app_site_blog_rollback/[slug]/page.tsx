import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabasePublic";
import { getPostJsonLd, getBreadcrumbJsonLd, serializeJsonLd } from '@/lib/jsonld';
import Image from 'next/image';
import { buildPostMetadata } from "@/lib/seo.core";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/MDXContent";
import { Toc } from '@/components/blog/Toc';
import Link from 'next/link';
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import BlogComments from "@/components/BlogComments";
import { getRelatedPosts } from '@/lib/relatedPosts';
import { SeoArticle } from "@/components/SeoArticle";
import Breadcrumbs from '@/components/Breadcrumbs';
import ShareButtons from '@/components/ShareButtons';
import SeoJsonLd from "@/components/SeoJsonLd";

type Post = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  excerpt: string | null;
  content_mdx: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  og_image_url?: string | null;
  published_at: string | null;
  reading_time?: number | null;
  blog_post_categories?: { category_id:string; blog_categories?: { name:string; slug:string } | null }[];
  blog_authors?: { id:string; name:string; slug:string; avatar_url:string|null; bio:string|null } | null;
};

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return buildPostMetadata(params.slug);
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const sb = supabasePublic();
  const { data } = await sb
    .from("blog_posts")
  .select("id,slug,title,subtitle,cover_url,excerpt,content_mdx,published_at,reading_time, blog_authors(id,name,slug,avatar_url,bio), (blog_post_categories(category_id,blog_categories(name,slug)))")
    .eq("slug", params.slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return notFound();
  const post = data as unknown as Post;

  // Extract simple FAQ pairs from MDX (section starting with a H2 containing "Perguntas" or "FAQ",
  // then H3 as questions and following paragraph(s) as answer until next heading)
  const faq = (() => {
    const src = String(post.content_mdx || "");
    if (!src) return [] as { question: string; answer: string }[];
    const hasFaqSection = /^##\s+.*(perguntas|faq)/gim.test(src);
    if (!hasFaqSection) return [] as { question: string; answer: string }[];
    const lines = src.split(/\r?\n/);
    const items: { question: string; answer: string }[] = [];
    let inFaq = false;
    let currentQ: string | null = null;
    let buffer: string[] = [];
    for (const line of lines) {
      const h2 = /^##\s+/.test(line);
      const h3 = /^###\s+/.test(line);
      if (h2) {
        // Enter FAQ if this H2 mentions FAQ/perguntas; otherwise exit
        inFaq = /perguntas|faq/i.test(line);
        if (!inFaq && currentQ) {
          items.push({ question: currentQ, answer: buffer.join("\n").trim() });
          currentQ = null; buffer = [];
        }
        continue;
      }
      if (!inFaq) continue;
      if (h3) {
        if (currentQ) {
          items.push({ question: currentQ, answer: buffer.join("\n").trim() });
        }
        currentQ = line.replace(/^###\s+/, "").trim();
        buffer = [];
        continue;
      }
      // stop if another H-level appears
      if (/^#\s+/.test(line)) {
        if (currentQ) items.push({ question: currentQ, answer: buffer.join("\n").trim() });
        currentQ = null; buffer = []; inFaq = false; continue;
      }
      if (currentQ) buffer.push(line);
    }
    if (currentQ) items.push({ question: currentQ, answer: buffer.join("\n").trim() });
    // sanitize and limit
    return items
      .map(({ question, answer }) => ({ question: question.slice(0, 180), answer: answer.slice(0, 2000) }))
      .filter((x) => x.question && x.answer)
      .slice(0, 12);
  })();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br';
  const jsonLdPost = getPostJsonLd({ siteUrl, slug: post.slug, title: post.title, description: post.excerpt || undefined, datePublished: post.published_at || undefined, dateModified: post.published_at || undefined, image: post.cover_url || undefined, authorName: post.blog_authors?.name || 'By Imperio Dog' });
  const jsonLdAuthor = post.blog_authors ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: post.blog_authors.name,
    url: `${siteUrl.replace(/\/$/, '')}/autores/${post.blog_authors.slug}`,
    image: post.blog_authors.avatar_url || undefined,
    description: post.blog_authors.bio || undefined
  } : null;
  // Optimized prev/next: two directional queries relative to this post's published_at
  let prev: { slug:string; title:string } | null = null;
  let next: { slug:string; title:string } | null = null;
  if(post.published_at){
    const { data: newer } = await sb.from('blog_posts')
      .select('slug,title,published_at')
      .eq('status','published')
      .gt('published_at', post.published_at)
      .order('published_at', { ascending: true })
      .limit(1);
    const { data: older } = await sb.from('blog_posts')
      .select('slug,title,published_at')
      .eq('status','published')
      .lt('published_at', post.published_at)
      .order('published_at', { ascending: false })
      .limit(1);
    if(older?.length) prev = { slug: older[0].slug, title: older[0].title } as any;
    if(newer?.length) next = { slug: newer[0].slug, title: newer[0].title } as any;
  }
  const breadcrumbItems = [ { name:'Blog', url:'/blog' }, { name: post.title, url:`/blog/${post.slug}` } ];
  const jsonLdBreadcrumb = getBreadcrumbJsonLd({ siteUrl, items: breadcrumbItems });
  const jsonLdPrevNext = prev || next ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [prev, next].filter(Boolean).map((p:any, i:number)=> ({ '@type':'ListItem', position:i+1, name:p.title, url: `${siteUrl}/blog/${p.slug}` }))
  } : null;

  return (
    <div className="mx-auto flex gap-8 px-6 py-10 max-w-6xl">
      <Toc />
      <article className="flex-1 max-w-3xl text-zinc-900">
  <SeoJsonLd data={jsonLdPost} />
  {jsonLdAuthor ? <SeoJsonLd data={jsonLdAuthor as any} /> : null}
  <SeoJsonLd data={jsonLdBreadcrumb} />
  {jsonLdPrevNext ? <SeoJsonLd data={jsonLdPrevNext} /> : null}
      <Breadcrumbs className="mb-3" items={[{ label: 'Início', href: '/' }, { label: 'Blog', href: '/blog' }, { label: post.title }]} />
      <nav className="mb-4 flex flex-wrap gap-4 text-sm text-emerald-700">
        {prev && <a href={`/blog/${prev.slug}`} className="hover:underline">← {prev.title}</a>}
        {next && <a href={`/blog/${next.slug}`} className="hover:underline ml-auto">{next.title} →</a>}
      </nav>
      {post.title && (
        <SeoArticle
          title={post.title}
          description={post.excerpt || post.subtitle || post.title}
          url={`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br"}/blog/${post.slug}`}
          published={post.published_at || new Date().toISOString()}
          modified={post.published_at || new Date().toISOString()}
          author={{ name: post.blog_authors?.name || "By Imperio Dog" }}
          faq={faq.length ? faq.map((f) => ({ question: f.question, answer: f.answer })) : undefined}
        />
      )}
      <header className="mb-6">
  <h1 className="text-4xl font-extrabold tracking-tight">{post.title}</h1>
        {post.subtitle ? <p className="mt-1 text-zinc-600">{post.subtitle}</p> : null}
        {post.published_at ? (
          <p className="mt-1 text-xs text-zinc-500">Publicado em {new Date(post.published_at).toLocaleDateString("pt-BR")}</p>
        ) : null}
        { (post as any).reading_time ? <p className="mt-1 text-xs text-zinc-500">Tempo de leitura: {(post as any).reading_time} min</p> : null }
        <CategoryChips post={post} />
        <ShareButtons className="mt-4" url={`${siteUrl}/blog/${post.slug}`} title={post.title} summary={post.excerpt || undefined} utm="utm_source=share&utm_medium=blog" />
      </header>
      {post.cover_url ? (
        <Image src={post.cover_url} alt={post.title} width={1200} height={630} className="mb-6 h-auto w-full rounded-xl border border-zinc-200 object-cover" />
      ) : null}

  {post.content_mdx ? (
        <div className="prose prose-zinc max-w-none">
          <MDXRemote
            source={post.content_mdx}
            components={mdxComponents as any}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
              },
            }}
          />
        </div>
      ) : (
        <p className="text-zinc-700">Conteúdo em breve.</p>
      )}
      {post.blog_authors && (
        <div className="mt-12 flex items-center gap-4 border-t pt-6">
          {post.blog_authors.avatar_url && (
            <Image src={post.blog_authors.avatar_url} alt={post.blog_authors.name} width={64} height={64} className="h-16 w-16 rounded-full object-cover border" />
          )}
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Autor</p>
            <Link href={`/autores/${post.blog_authors.slug}`} className="font-medium hover:underline">{post.blog_authors.name}</Link>
            {post.blog_authors.bio && <p className="mt-1 text-sm text-zinc-600 max-w-xl line-clamp-3">{post.blog_authors.bio}</p>}
          </div>
        </div>
      )}
  {/* comentários abaixo */}
  <BlogComments postId={post.id} />
  {/* Leia também */}
  <Related slug={post.slug} />
      </article>
    </div>
  );
}

async function Related({ slug }: { slug:string }){
  const items = await getRelatedPosts(slug, 6);
  if(!items.length) return null;
  return <div className="mt-12 border-t pt-6"><h2 className="text-xl font-semibold mb-4">Leia também</h2><ul className="grid gap-4 sm:grid-cols-2">
    {items.slice(0,4).map((p)=> <li key={p.id} className="rounded border p-3 bg-white shadow-sm">
      <Link href={`/blog/${p.slug}`} className="font-medium hover:underline line-clamp-2">{p.title}</Link>
      {p.authorName && <p className="mt-0.5 text-[11px] text-emerald-700">por <Link href={`/autores/${p.authorSlug}`} className="underline hover:no-underline">{p.authorName}</Link></p>}
      <p className="mt-1 text-[13px] text-zinc-600 line-clamp-3">{p.excerpt||''}</p>
    </li>)}
  </ul></div>;
}

function CategoryChips({ post }: { post: Post }){
  const cats = (post.blog_post_categories||[]).map(c=> c.blog_categories).filter(Boolean) as {name:string;slug:string}[];
  if(!cats.length) return null;
  return <div className="mt-2 flex flex-wrap gap-2">{cats.map(c=> <Link key={c.slug} href={`/categorias/${c.slug}`} className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-100">{c.name}</Link>)}</div>;
}
