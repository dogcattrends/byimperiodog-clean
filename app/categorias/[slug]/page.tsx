import Link from "next/link";
import { notFound } from "next/navigation";

import FAQBlock from "@/components/answer/FAQBlock";
import PostCard from "@/components/blog/PostCard";
import { buildBlogMetadata } from "@/lib/blog/seo";
import { sanityBlogRepo } from "@/lib/sanity/blogRepo";

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br";
  const slug = decodeURIComponent(params.slug);
  return buildBlogMetadata(
    {
      slug: `categorias/${slug}`,
      title: `Categoria: ${slug}`,
      seo_description: `Artigos da categoria ${slug}`,
    } as any,
    { baseUrl: site }
  );
}

const CATEGORY_SNIPPET =
  "Esta página agrupa artigos por categoria, facilitando a navegação por temas sobre Spitz Alemão Anão (Lulu da Pomerânia). Use a lista para explorar guias relacionados e volte quando novas publicações aparecerem.";

const CATEGORY_FAQ = [
  { question: "O que é uma categoria?", answer: "Categorias organizam o conteúdo por assunto principal." },
  { question: "Como os artigos entram aqui?", answer: "Quando um post é marcado com a categoria no Sanity, ele aparece automaticamente." },
  { question: "Com que frequência atualiza?", answer: "Sempre que novos posts são publicados." },
];

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = decodeURIComponent(params.slug);

  const result = await sanityBlogRepo.listSummaries({
    category,
    limit: 200,
    status: "published",
    sort: "recentes",
  });

  const posts = result.items.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || null,
    cover_url: post.coverUrl || null,
    published_at: post.publishedAt || null,
  }));

  if (!posts.length) return notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-serif">{`Categoria: ${category}`}</h1>
        <p className="text-sm text-text-muted">Artigos agrupados por categoria — atualização automática.</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Resposta curta</h2>
        <p className="mt-2 text-sm text-text-muted">{CATEGORY_SNIPPET}</p>
      </section>

      <FAQBlock items={CATEGORY_FAQ} />

      <section className="grid gap-6 md:grid-cols-2">
        {posts.map((p) => (
          <article key={p.slug}>
            <Link href={`/blog/${p.slug}`}>
              <PostCard
                href={`/blog/${p.slug}`}
                title={p.title ?? p.slug}
                coverUrl={p.cover_url}
                excerpt={p.excerpt}
                date={p.published_at}
                readingTime={null}
              />
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
