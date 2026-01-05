import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import FAQBlock from "@/components/answer/FAQBlock";
import PostCard from "@/components/blog/PostCard";
import { buildBlogMetadata } from "@/lib/blog/seo";
import { supabaseAnon } from "@/lib/supabaseAnon";

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
  type BuildArg = Parameters<typeof buildBlogMetadata>[0];
  return buildBlogMetadata({ slug: `autores/${author.slug}`, title: author.name, seo_description: author.bio || undefined } as unknown as BuildArg);
}

const AUTHOR_SNIPPET =
  "Esta pagina apresenta o autor e os artigos assinados sobre Spitz Alemao Anao (Lulu da Pomerania). Aqui voce pode conhecer o perfil, ler a biografia e acessar os guias publicados. O objetivo e dar contexto sobre a experiencia de quem escreve e facilitar a navegacao por temas.";

const AUTHOR_FAQ = [
  { question: "Quem escreve os artigos?", answer: "Autores e colaboradores da By Imperio Dog." },
  { question: "Como encontrar outros textos?", answer: "Use a lista abaixo para acessar os posts do autor." },
  { question: "Posso entrar em contato?", answer: "Sim, use o formulario de contato para encaminhar perguntas." },
];

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
