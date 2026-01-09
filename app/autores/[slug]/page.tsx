import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import FAQBlock from "@/components/answer/FAQBlock";
import PostCard from "@/components/blog/PostCard";
import { buildBlogMetadata } from "@/lib/blog/seo";
import { sanityClient } from "@/lib/sanity/client";

type AuthorDoc = {
  _id?: string;
  name?: string | null;
  slug?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
};

type Author = {
  _id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
};

type AuthorPostSummary = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  published_at: string | null;
};

async function fetchAuthorBySlug(slug: string) {
  try {
    const author = await sanityClient.fetch<AuthorDoc | null>(
      `*[_type == "author" && slug.current == $slug][0]{
        _id,
        name,
        "slug": slug.current,
        bio,
        "avatar_url": coalesce(avatar.asset->url, image.asset->url, mainImage.asset->url)
      }`,
      { slug }
    );

    if (!author?._id) return null;
    return {
      _id: author._id,
      name: author.name?.trim() || "Autor",
      slug: author.slug?.trim() || slug,
      bio: author.bio ?? null,
      avatar_url: author.avatar_url ?? null,
    } satisfies Author;
  } catch {
    return null;
  }
}

async function fetchPostsByAuthor(authorId: string) {
  try {
    const posts = await sanityClient.fetch<AuthorPostSummary[]>(
      `*[_type == "post" && author._ref == $authorId && (status == "published" || (defined(publishedAt) && dateTime(publishedAt) <= now()))]
        | order(publishedAt desc)[0...50]{
          "slug": coalesce(slug.current, _id),
          "title": coalesce(title, "Post"),
          "excerpt": coalesce(description, excerpt),
          "cover_url": coalesce(coverUrl, coverImage.asset->url, mainImage.asset->url),
          "published_at": coalesce(publishedAt, _createdAt)
        }`,
      { authorId }
    );
    return Array.isArray(posts) ? posts : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const author = await fetchAuthorBySlug(params.slug);
  if (!author) return {};
  type BuildArg = Parameters<typeof buildBlogMetadata>[0];
  return buildBlogMetadata({ slug: `autores/${author.slug}`, title: author.name, seo_description: author.bio || undefined } as unknown as BuildArg);
}

const AUTHOR_SNIPPET =
  "Esta página apresenta o autor e os artigos assinados sobre Spitz Alemão Anão (Lulu da Pomerânia). Aqui você pode conhecer o perfil, ler a biografia e acessar os guias publicados. O objetivo é dar contexto sobre a experiência de quem escreve e facilitar a navegação por temas.";

const AUTHOR_FAQ = [
  { question: "Quem escreve os artigos?", answer: "Autores e colaboradores da By Império Dog." },
  { question: "Como encontrar outros textos?", answer: "Use a lista abaixo para acessar os posts do autor." },
  { question: "Posso entrar em contato?", answer: "Sim, use o formulário de contato para encaminhar perguntas." },
];

export default async function AuthorPage({ params }: { params: { slug: string } }) {
  const author = await fetchAuthorBySlug(params.slug);
  if (!author) return notFound();
  const posts = await fetchPostsByAuthor(author._id ?? "");

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
          {author.bio ? <p className="text-sm text-text-muted">{author.bio}</p> : null}
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-4">
  <h2 className="text-lg font-semibold">Resposta curta</h2>
  <p className="mt-2 text-sm text-text-muted">{AUTHOR_SNIPPET}</p>
</section>

<FAQBlock items={AUTHOR_FAQ} />

<section>
        <h2 className="mb-4 text-xl font-medium">Artigos por {author.name}</h2>
        <ul className="grid gap-6">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`}>
                <PostCard href={`/blog/${p.slug}`} title={p.title} coverUrl={p.cover_url} excerpt={p.excerpt} date={p.published_at} readingTime={null} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
