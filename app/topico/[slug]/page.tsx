import Link from 'next/link';
import { notFound } from 'next/navigation';

import FAQBlock from '@/components/answer/FAQBlock';
import PostCard from '@/components/blog/PostCard';
import { getPostsByTag } from '@/lib/blog/related';
import { buildBlogMetadata } from '@/lib/blog/seo';

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br';
  return buildBlogMetadata({ slug: `topico/${params.slug}`, title: `Topico: ${params.slug}`, seo_description: `Artigos sobre ${params.slug}` } as any, { baseUrl: site });
}

const TOPICO_SNIPPET =
  "Esta pagina agrupa artigos por topico, facilitando a pesquisa sobre Spitz Alemao Anao (Lulu da Pomerania). Use a lista para explorar guias relacionados e voltar quando novas publicacoes aparecerem. O objetivo e organizar o conhecimento por assunto para tomada de decisao rapida.";

const TOPICO_FAQ = [
  { question: "Como os artigos sao agrupados?", answer: "Usamos tags para reunir conteudos do mesmo assunto." },
  { question: "Com que frequencia atualiza?", answer: "Novos artigos aparecem automaticamente quando publicados." },
  { question: "Posso sugerir um topico?", answer: "Sim, envie sugestoes pelo contato oficial." },
];

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const tag = decodeURIComponent(params.slug);
  const posts = await getPostsByTag(tag, 200);
  if (!posts) return notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-serif">{`Tópico: ${tag}`}</h1>
        <p className="text-sm text-text-muted">Artigos agrupados por tópico — atualização automática.</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Resposta curta</h2>
        <p className="mt-2 text-sm text-text-muted">{TOPICO_SNIPPET}</p>
      </section>

      <FAQBlock items={TOPICO_FAQ} />

<section className="grid gap-6 md:grid-cols-2">
        {posts.map((p: any) => (
          <article key={p.slug}>
            <Link href={`/blog/${p.slug}`}>
              <PostCard href={`/blog/${p.slug}`} title={p.title} coverUrl={p.cover_url} excerpt={p.excerpt} date={p.published_at} readingTime={null} />
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
