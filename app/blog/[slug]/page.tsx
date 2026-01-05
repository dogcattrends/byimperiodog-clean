// Conteúdo vem do Sanity. Supabase armazena apenas eventos/IA.
// NÃO copie o corpo do post para Supabase — Sanity é a Source of Truth.

import { PortableText } from "@portabletext/react";
import type { TypedObject } from "@portabletext/types";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";


import FAQBlock from "@/components/answer/FAQBlock";
import BlogCTAs from "@/components/blog/BlogCTAs";
import Comments from "@/components/blog/Comments";
import PostCard from "@/components/blog/PostCard";
import Prose from "@/components/blog/Prose";
import ScrollAnalytics from "@/components/blog/ScrollAnalytics";
import ShareButtons from "@/components/blog/ShareButtons";
import Toc from "@/components/blog/Toc";
import Breadcrumbs from "@/components/Breadcrumbs";
import LeadForm from "@/components/LeadForm";
import PageViewPing from "@/components/PageViewPing";
import SeoJsonLd from "@/components/SeoJsonLd";
import { buildAnswerSnippet } from "@/lib/ai-readiness";
import type { TocItem } from "@/lib/blog/mdx/toc";
import { BLUR_DATA_URL } from "@/lib/placeholders";
import { sanityBlogRepo } from "@/lib/sanity/blogRepo";
import { blogPostingSchema } from "@/lib/seo.core";
import { whatsappLeadUrl } from "@/lib/utm";

// Função utilitária local para formatar datas
function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function firstSentence(value?: string | null) {
  if (!value) return "";
  const match = value.match(/[^.!?]+[.!?]/);
  return match ? match[0].trim() : value.trim();
}

function ensureSentence(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function splitSentences(value?: string | null) {
  if (!value) return [] as string[];
  return value
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

type PageProps = {
  params: { slug: string };
  searchParams?: Record<string, string>;
};


export default async function Page({ params }: PageProps) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
  // Buscar o post pelo slug
  const post = await sanityBlogRepo.getPostBySlug(params.slug);
  if (!post) return notFound();
  type Author = { name?: string; slug?: string; avatar_url?: string };
  type Reviewer = { name?: string };
  type Source = { url?: string; label?: string };
  type BlogPost = {
    id?: string;
    slug?: string;
    title?: string;
    description?: string | null;
    seo_description?: string | null;
    seoDescription?: string | null;
    excerpt?: string | null;
    subtitle?: string | null;
    answerSnippet?: string | null;
    tldr?: string | null;
    reading_time?: number | null;
    readingTime?: number | null;
    toc?: TocItem[] | null;
    tableOfContents?: TocItem[] | null;
    related?: BlogPost[] | null;
    status?: string | null;
    faq?: Array<{ question?: string; answer?: string }> | null;
    key_takeaways?: string[] | null;
    keyTakeaways?: string[] | null;
    sources?: Source[] | null;
    coverUrl?: string | null;
    cover_url?: string | null;
    coverAlt?: string | null;
    cover_alt?: string | null;
    publishedAt?: string | null;
    published_at?: string | null;
    updatedAt?: string | null;
    updated_at?: string | null;
    createdAt?: string | null;
    created_at?: string | null;
    tags?: string[] | null;
    category?: string | null;
    section?: string | null;
    author?: Author | string | null;
    reviewer?: Reviewer | null;
    content_blocks?: TypedObject | TypedObject[] | null;
  };

  const p = post as unknown as BlogPost;

  // Normalizações locais
  const rawAuthor = p.author;
  const author = typeof rawAuthor === "object" && rawAuthor !== null ? (rawAuthor as Author) : undefined;
  const reviewer = p.reviewer ? (p.reviewer as Reviewer) : undefined;
  const minutes = (p.reading_time ?? p.readingTime) ?? undefined;
  const toc = Array.isArray(p.toc) ? p.toc : Array.isArray(p.tableOfContents) ? p.tableOfContents! : [];
  const related = (p.related ?? []) as BlogPost[];
  const preview = p.status !== "published";

  // SEO e dados estruturados
  const description = String(p.seo_description ?? p.seoDescription ?? p.excerpt ?? p.subtitle ?? "");
  const answerSnippet = buildAnswerSnippet([
    p.answerSnippet ?? undefined,
    p.tldr ?? undefined,
    description,
    p.excerpt ?? undefined,
    p.subtitle ?? undefined,
  ]);
  // Garantir que o trecho de resposta tenha entre 40 e 70 palavras e seja estritamente factual.
  function normalizeTextLocal(v?: string | null) {
    if (!v) return "";
    return String(v).replace(/\s+/g, " ").trim();
  }
  function clampWordsLocal(text: string, minWords = 40, maxWords = 70) {
    const words = normalizeTextLocal(text).split(" ").filter(Boolean);
    if (!words.length) return "";
    if (words.length > maxWords) return words.slice(0, maxWords).join(" ");
    if (words.length >= minWords) return words.join(" ");
    return words.join(" ");
  }
  function ensureSnippetBounds(base: string) {
    const normalized = normalizeTextLocal(base);
    const count = normalized ? normalized.split(" ").filter(Boolean).length : 0;
    if (count >= 40 && count <= 70) return clampWordsLocal(normalized);
    // Complementos factuais (sem marketing) para alcançar mínimo de palavras
    const extras: string[] = [];
    if (p.publishedAt ?? p.published_at) {
      const fd = formatDate(String(p.publishedAt ?? p.published_at));
      if (fd) extras.push(`Publicado em ${fd}`);
    }
    if (minutes !== undefined) extras.push(`${minutes} min de leitura`);
    if (author && author.name) extras.push(`Por ${String(author.name)}`);
    if (p.category) extras.push(String(p.category));
    const augmented = [normalized, ...extras.filter(Boolean)].filter(Boolean).join('. ');
    const clamped = clampWordsLocal(augmented);
    // Se ainda for muito curto, incluir primeira frase da descrição (factual)
    if (clamped.split(" ").filter(Boolean).length < 40) {
      const extraDef = firstSentence(description || "");
      return clampWordsLocal([clamped, extraDef].filter(Boolean).join('. '));
    }
    return clamped;
  }
  const finalAnswerSnippet = ensureSnippetBounds(answerSnippet);
  const keyTakeaways = Array.isArray(p.key_takeaways)
    ? p.key_takeaways
    : Array.isArray(p.keyTakeaways)
      ? p.keyTakeaways
      : [];
  const sources = Array.isArray(p.sources) ? p.sources : [];
  const definition = firstSentence(description || finalAnswerSnippet);
  const normalizedDefinition = ensureSentence(definition);
  const fallbackSentences = Array.from(new Set([
    ...splitSentences(description),
    ...splitSentences(finalAnswerSnippet),
  ].map((sentence) => ensureSentence(sentence)).filter(Boolean))).filter((sentence) => sentence !== normalizedDefinition);
  const summaryPoints = keyTakeaways.length ? keyTakeaways : fallbackSentences.slice(0, 3);
  const fallbackFaq = [
    { question: "Como este guia ajuda o tutor?", answer: "Ele resume os pontos essenciais e orienta os proximos passos." },
    { question: "O conteudo e atualizado?", answer: "Revisamos o material conforme surgem novas duvidas de tutores." },
    { question: "Posso falar com a equipe?", answer: "Sim, use o formulario de contato para orientacao personalizada." },
  ];
  const faqItems = Array.isArray(p.faq) && p.faq.length
    ? (p.faq as Array<{ question?: string; answer?: string }>)
        .map((f) => ({ question: f.question ?? "", answer: f.answer ?? "" }))
        .filter((q) => q.question.trim() && q.answer.trim())
    : fallbackFaq;
  const blogSchema = blogPostingSchema(siteUrl, {
    slug: String(p.slug ?? (post as unknown as Record<string, unknown>).slug ?? ""),
    title: String(p.title ?? ""),
    description: String(description ?? ""),
    publishedAt: String(p.publishedAt ?? p.published_at ?? p.createdAt ?? p.created_at ?? new Date().toISOString()),
    modifiedAt: p.updatedAt ?? p.updated_at ?? p.publishedAt ?? p.published_at ?? undefined,
    image: (p.coverUrl ?? p.cover_url) ? { url: String(p.coverUrl ?? p.cover_url), alt: p.coverAlt ?? p.cover_alt ?? undefined } : undefined,
    author: author ? { name: String(author.name ?? ""), url: author.slug ? `${siteUrl}/autores/${String(author.slug)}` : undefined } : undefined,
    keywords: Array.isArray(p.tags) ? p.tags.map((t: unknown) => (typeof t === "string" ? t : String((t as Record<string, unknown>)?.name ?? t))) : undefined,
    articleSection: typeof p.category === "string" ? p.category : null,
  });
  const structuredData = [blogSchema];

  const interlinks = [
    {
      title: "Filhotes sob consulta",
      description: "Entenda como selecionamos cada família e garanta prioridade na próxima ninhada.",
      href: "/filhotes",
    },
    {
      title: "Processo completo",
      description: "Veja as etapas: entrevista, socialização, entrega humanizada e mentoria vitalícia.",
      href: "/sobre#processo",
    },
    {
      title: "FAQ do tutor",
      description: "Respostas claras sobre investimento, suporte, logística e rotina diária.",
      href: "/faq",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-10">
      <PageViewPing pageType="blog" />
      <SeoJsonLd data={structuredData} />
      {preview ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
          <span className="font-medium">Pré-visualização</span>
          <span>
            Status atual: <strong>{p.status}</strong>
          </span>
          <form method="POST" action={`/api/admin/blog/publish?slug=${p.slug}`} style={{ display: 'inline' }}>
            <button type="submit" className="inline-flex items-center gap-1 rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white shadow hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1">
              Publicar agora
            </button>
          </form>
          <a href={`/blog/${p.slug}`} className="underline decoration-dotted">
            Sair do modo preview
          </a>
        </div>
      ) : null}

      <Breadcrumbs
        className="mb-6"
        items={[
          { label: "Início", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: String(p.title ?? ""), href: `/blog/${p.slug}` },
        ]}
      />

      <article className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
        <div className="w-full flex-1 space-y-10">

          <header className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-pill bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-brand">
              {p.category || p.section || "Conteúdo premium"}
            </span>
            <h1 className="text-3xl font-serif text-text sm:text-4xl">{p.title}</h1>
            {p.subtitle ? <p className="text-base text-text-muted">{p.subtitle}</p> : null}
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-soft">
              { (p.publishedAt ?? p.published_at) ? <span>Publicado em {formatDate(String(p.publishedAt ?? p.published_at))}</span> : null}
              { (p.updatedAt ?? p.updated_at) && (p.updatedAt ?? p.updated_at) !== (p.publishedAt ?? p.published_at) ? (
                <span className="rounded-pill bg-surface-subtle px-3 py-1 font-medium text-text">Atualizado em {formatDate(String(p.updatedAt ?? p.updated_at))}</span>
              ) : null}
              {reviewer ? (
                <span className="rounded-pill bg-surface-subtle px-3 py-1 font-medium text-text">Revisado por {String(reviewer.name)}</span>
              ) : null}
              {minutes !== undefined ? (
                <span className="rounded-pill bg-surface-subtle px-3 py-1 font-semibold text-text">
                  {minutes} min de leitura
                </span>
              ) : null}
            </div>
            {author ? (
              <div className="mt-2 flex items-center gap-3 text-sm text-text">
                {author?.avatar_url ? (
                  <Image
                    src={String(author.avatar_url)}
                    alt={String(author.name ?? "")}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full border object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full border bg-surface-subtle" aria-hidden />
                )}
                <div>
                  <span className="text-text-muted">Por </span>
                  {author?.slug ? (
                    <Link href={`/autores/${String(author.slug)}`} className="font-medium underline-offset-2 hover:underline">
                      {String(author.name)}
                    </Link>
                  ) : (
                    <span className="font-medium">{String(author?.name ?? "")}</span>
                  )}
                </div>
              </div>
            ) : null}
          </header>

          {finalAnswerSnippet ? (
            <section data-geo-answer={String(p.slug ?? "blog-post")} aria-labelledby="resposta-curta" className="rounded-2xl border border-border bg-surface p-4">
              <h2 id="resposta-curta" className="text-lg font-semibold">Resposta curta</h2>
              <p className="mt-2 text-sm text-text-muted">{finalAnswerSnippet}</p>
            </section>
          ) : null}

          {(normalizedDefinition || summaryPoints.length || sources.length) ? (
            <section aria-labelledby="resumo-ia" className="rounded-2xl border border-border bg-surface p-4">
              <h2 id="resumo-ia" className="text-lg font-semibold">Resumo para IA</h2>
              {normalizedDefinition ? (
                <div className="mt-3">
                  <h3 className="text-sm font-semibold">Definição rápida</h3>
                  <p className="mt-2 text-sm text-text-muted">{normalizedDefinition}</p>
                </div>
              ) : null}
              {summaryPoints.length ? (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold">Principais pontos</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
                    {summaryPoints.slice(0, 5).map((item: string, idx: number) => (
                      <li key={idx}>{ensureSentence(item)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {sources.length ? (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold">Fontes</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
                    {sources.slice(0, 4).map((source: { url?: string; label?: string }, idx: number) => (
                      <li key={idx}>
                        <a className="underline decoration-dotted" href={source.url} rel="noreferrer" target="_blank">
                          {source.label || source.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {(p.coverUrl ?? p.cover_url) ? (
            <figure className="overflow-hidden rounded-3xl border border-border bg-surface-subtle shadow-soft">
              <Image
                src={String(p.coverUrl ?? p.cover_url)}
                alt={String(p.coverAlt ?? p.cover_alt ?? p.title ?? "")}
                width={1280}
                height={720}
                priority
                fetchPriority="high"
                className="h-full w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 65vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                decoding="async"
                draggable={false}
              />
              {(p.coverAlt ?? p.cover_alt) ? (
                <figcaption className="px-5 py-3 text-xs text-text-soft">{p.coverAlt ?? p.cover_alt}</figcaption>
              ) : null}
            </figure>
          ) : null}

          {/* resposta curta já renderizada acima; evitar duplicação */}

          {Array.isArray(p.key_takeaways) && p.key_takeaways.length ? (
            <section className="mt-4 rounded-md border border-border bg-surface p-4">
              <h2 className="mb-2 text-sm font-semibold">Principais insights</h2>
              <ul className="list-inside list-disc text-sm text-text-muted">
                {p.key_takeaways.map((t: string, i: number) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {toc.length ? (
            <div className="mt-4">
              <Toc toc={toc} />
            </div>
          ) : null}

          <div className="flex flex-col gap-4 rounded-2xl border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Compartilhe</p>
              <p className="text-sm text-text-muted">Leve conhecimento premium para outros tutores responsáveis.</p>
            </div>
            <ShareButtons title={p.title ?? ""} url={`${siteUrl}/blog/${p.slug}`} />
          </div>

          <Prose>
            {p.content_blocks && (Array.isArray(p.content_blocks) ? p.content_blocks.length : true) ? (
              <PortableText value={p.content_blocks as TypedObject | TypedObject[]} components={portableTextComponents} />
            ) : (
              <p className="italic text-text-muted">Conteúdo em atualização.</p>
            )}
          </Prose>

          <FAQBlock items={faqItems} />
          <section className="mt-10">
            <h2 className="text-xl font-semibold">Quero receber recomendações</h2>
            <LeadForm context={{ pageType: "blog", slug: p.slug }} />
            {process.env.NEXT_PUBLIC_WA_PHONE && (
              <div className="pt-2">
                <a
                  className="inline-block rounded bg-green-600 px-4 py-2 text-white"
                  target="_blank"
                  rel="noreferrer"
                  href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), {
                    pageType: "blog",
                    url: `${siteUrl}/blog/${p.slug}`,
                  })}
                >
                  Falar no WhatsApp
                </a>
              </div>
            )}
          </section>

          <aside className="grid gap-4 rounded-3xl border border-border bg-surface-subtle p-6 shadow-soft sm:grid-cols-3">
            {interlinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-surface p-4 transition hover:-translate-y-1 hover:border-brand/70"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Leia também</span>
                <h3 className="text-sm font-semibold text-text group-hover:text-brand">{item.title}</h3>
                <p className="text-xs text-text-muted">{item.description}</p>
              </Link>
            ))}
          </aside>

          <BlogCTAs postTitle={p.title ?? ""} category={p.category ?? null} />

          <div className="mt-16 border-t border-border pt-12">
            <Comments postId={String(post.id ?? p.id ?? "")} />
          </div>

          {related?.length ? (
            <aside className="mt-20 border-t border-border pt-12">
              <h2 className="mb-6 text-2xl font-serif text-text">Artigos relacionados</h2>
              <ul className="grid gap-6 sm:grid-cols-2">
                {related.slice(0, 4).map((relatedPost) => {
                  const fallbackFields = relatedPost as unknown as Record<string, string | null | undefined>;
                  const cardCoverUrl = relatedPost.coverUrl ?? fallbackFields["cover_url"] ?? null;
                  const cardDate = relatedPost.publishedAt ?? fallbackFields["published_at"] ?? null;
                  return (
                    <PostCard
                      key={relatedPost.slug}
                      href={`/blog/${relatedPost.slug}`}
                      title={relatedPost.title ?? "Artigo relacionado"}
                      coverUrl={cardCoverUrl}
                      excerpt={relatedPost.excerpt}
                      date={cardDate}
                      readingTime={null}
                    />
                  );
                })}
              </ul>
            </aside>
          ) : null}
        </div>

        <div className="hidden w-full max-w-xs shrink-0 lg:block">
          {toc.length ? <Toc toc={toc} /> : null}
        </div>
      </article>

      <ScrollAnalytics postId={String(post.id ?? p.id ?? "")} readingTimeMin={minutes ?? undefined} />
    </div>
  );
}


const portableTextComponents = {
  types: {
    image: ({ value }: { value?: { asset?: { url?: string }; caption?: string } }) => {
      const url = value?.asset?.url;
      if (!url) return null;
      return (
        <figure className="my-10 overflow-hidden rounded-3xl border border-border bg-surface-subtle shadow-soft">
          <Image src={url} alt={value?.caption || "Imagem do post"} width={1280} height={720} className="w-full object-cover" />
          {value?.caption ? (
            <figcaption className="px-5 py-3 text-xs text-text-soft">{value.caption}</figcaption>
          ) : null}
        </figure>
      );
    },
    code: ({ value }: { value?: { code?: string } }) => {
      if (!value?.code) return null;
      return (
        <pre className="my-6 overflow-auto rounded-2xl border border-border bg-surface p-4 text-sm text-text">
          <code>{value.code}</code>
        </pre>
      );
    },
  },
};
