import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabaseAnon } from "@/lib/supabaseAnon";
import { buildBlogMetadata } from "@/lib/blog/seo";
import PostCard from "@/components/blog/PostCard";

async function fetchAuthorBySlug(slug: string) {
  try {
    const sb = supabaseAnon();
    const { data } = await sb.from("blog_authors").select("id,name,slug,bio,avatar_url").eq("slug", slug).maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

async function fetchPostsByAuthor(authorId: string) {
  try {
    const sb = supabaseAnon();
    const { data } = await sb.from("blog_posts").select("slug,title,excerpt,cover_url,published_at").eq("author_id", authorId).eq("status", "published").order("published_at", { ascending: false });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const author = await fetchAuthorBySlug(params.slug);
  if (!author) return {};
  return buildBlogMetadata({ slug: `autores/${author.slug}`, title: author.name, seo_description: (author as any).bio || undefined } as any);
}

export default async function AuthorPage({ params }: { params: { slug: string } }) {
  const author = await fetchAuthorBySlug(params.slug);
  if (!author) return notFound();
  const posts = await fetchPostsByAuthor(author.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center gap-4">
        {author.avatar_url ? (
          <Image src={author.avatar_url} alt={author.name} width={96} height={96} className="rounded-full" />
        ) : (
          <div className="h-24 w-24 rounded-full bg-surface-subtle" />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{author.name}</h1>
          {(author as any).bio ? <p className="text-sm text-text-muted">{(author as any).bio}</p> : null}
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-medium">Artigos por {author.name}</h2>
        <ul className="grid gap-6">
          {posts.map((p: any) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`}>
                <a>
                  <PostCard href={`/blog/${p.slug}`} title={p.title} coverUrl={p.cover_url} excerpt={p.excerpt} date={p.published_at} readingTime={null} />
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
