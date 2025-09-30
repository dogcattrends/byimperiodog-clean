import { supabasePublic } from '@/lib/supabasePublic';
import { blogCanonical, buildBlogPostMetadata } from '@/lib/seo.blog';
import SeoJsonLd from '@/components/SeoJsonLd';
import { blogBreadcrumbJsonLd } from '@/lib/blog.breadcrumbs';

export default async function Head({ params }: { params:{ slug:string } }) {
  const sb = supabasePublic();
  const { data } = await sb.from('blog_posts')
    .select('slug,title,excerpt,cover_url,published_at,updated_at,blog_authors(name,slug)')
    .eq('slug', params.slug)
    .eq('status','published')
    .maybeSingle();
  if(!data){
    return (
      <>
        <title>Post não encontrado | Blog</title>
        <meta name="robots" content="noindex" />
      </>
    );
  }
  const m = buildBlogPostMetadata({ slug:data.slug, title:data.title, description:data.excerpt, image:data.cover_url, published:data.published_at });
  const canonical = blogCanonical(`/blog/${data.slug}`);
  const breadcrumb = blogBreadcrumbJsonLd([
    { name:'Blog', url: blogCanonical('/blog') },
    { name:data.title, url: canonical }
  ]);
  const author = (data as any).blog_authors as { name:string; slug:string } | null;
  const postJsonLd = {
    '@context':'https://schema.org',
    '@type':'BlogPosting',
    headline: data.title,
    description: data.excerpt || undefined,
    datePublished: data.published_at || undefined,
    dateModified: data.updated_at || data.published_at || undefined,
    image: data.cover_url || undefined,
  author: author ? { '@type':'Person', name:author.name, url: blogCanonical(`/autores/${author.slug}`) } : undefined,
    mainEntityOfPage: canonical,
    url: canonical
  };
  return (
    <>
      <title>{m.title as any}</title>
      {m.description && <meta name="description" content={m.description} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={m.openGraph?.title as string} />
      {m.openGraph?.description && <meta property="og:description" content={m.openGraph.description as string} />}
      {(() => {
        const imgs:any = m.openGraph?.images;
        if (!imgs) return null;
        if (typeof imgs === 'string') return <meta property="og:image" content={imgs} />;
        if (Array.isArray(imgs) && imgs.length) {
          const first = imgs[0];
          if (typeof first === 'string') return <meta property="og:image" content={first} />;
          if (first?.url) return <meta property="og:image" content={first.url} />;
        }
        return null;
      })()}
      <meta name="twitter:card" content="summary_large_image" />
      <SeoJsonLd data={postJsonLd} />
      <SeoJsonLd data={breadcrumb} />
    </>
  );
}