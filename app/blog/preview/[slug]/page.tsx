import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/MDXContent";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: false } };
}

export default async function PreviewPost({ params, searchParams }: { params: { slug: string }; searchParams?: { token?: string } }) {
  const token = (searchParams?.token || "").trim();
  if (!process.env.PREVIEW_SECRET || token !== process.env.PREVIEW_SECRET) {
    return notFound();
  }

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("blog_posts")
    .select("id,slug,title,subtitle,cover_url,excerpt,content_mdx,created_at,updated_at,status,published_at")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!data) return notFound();
  const post = data as any;

  return (
    <article className="mx-auto max-w-3xl px-6 py-10 text-zinc-900">
      <div className="mb-3 rounded-full bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 inline-block text-xs">PREVIEW</div>
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold leading-tight">{post.title}</h1>
        {post.subtitle ? <p className="mt-1 text-zinc-600">{post.subtitle}</p> : null}
        <p className="mt-1 text-xs text-zinc-500">Status: {post.status}</p>
      </header>
      {post.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_url} alt={post.title} className="mb-6 w-full rounded-xl border border-zinc-200 object-cover" />
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
    </article>
  );
}

