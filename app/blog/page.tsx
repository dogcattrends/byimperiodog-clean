import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import FAQBlock from "@/components/answer/FAQBlock";
import BlogCard from "@/components/blog/BlogCard";
import SeoJsonLd from "@/components/SeoJsonLd";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { BLUR_DATA_URL } from "@/lib/placeholders";
import { listPublicPosts, type PublicPostsPage } from "@/lib/sanity/publicPosts";
import { baseBlogMetadata, SITE_ORIGIN } from "@/lib/seo.core";

type SortOption = "recentes" | "antigos";

type PublicPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_url?: string | null;
  cover_alt?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  content_mdx?: string | null;
  tags?: string[] | null;
  category?: string | null;
};

type CategoryDefinition = {
  id: string;
  title: string;
  description: string;
  highlight: string;
  match: (post: PublicPost) => boolean;
  cta: { label: string; href: string };
};

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: "guia-do-tutor",
    title: "Guia do Tutor",
    description:
      "Rotinas, enxoval, planejamento financeiro e a jornada completa para receber um Spitz Alemão Anão (Lulu da Pomerânia) equilibrado em casa.",
    highlight: "Checklist premium e mentoria vitalicia para familias exigentes.",
    match: (post) => includesCategory(post, ["guia", "tutor", "planejamento"]),
    cta: { label: "Planejar rotina", href: "/sobre" },
  },
  {
    id: "cuidados",
    title: "Cuidados",
    description:
      "Nutricao personalizada, higiene estrategica e protocolos preventivos para manter o Spitz Alemão Anão (Lulu da Pomerânia) saudavel e confiante.",
    highlight: "Orientacoes da neonatologia ao primeiro ano com suporte continuo.",
    match: (post) => includesCategory(post, ["cuidado", "rotina", "nutri", "higiene"]),
    cta: { label: "Ver dicas de cuidados", href: "/faq#cuidados" },
  },
  {
    id: "adestramento",
    title: "Adestramento",
    description:
      "Socializacao guiada, enriquecimento ambiental e reforco positivo focado em lares urbanos com agenda cheia.",
    highlight: "Protocolos semanais com videos e check-ins pelo WhatsApp.",
    match: (post) => includesCategory(post, ["adestramento", "comportamento", "socializacao"]),
    cta: { label: "Conhecer nosso processo", href: "/sobre#processo" },
  },
  {
    id: "saude",
    title: "Saude",
    description:
      "Preventivo completo: exames geneticos, cardiologicos e protocolos veterinarios para o Spitz Alemão Anão (Lulu da Pomerânia) ate 22 cm.",
    highlight: "Transparencia total com laudos digitais e acompanhamento pos-entrega.",
    match: (post) => includesCategory(post, ["saude", "clinico", "veterin", "check-up"]),
    cta: { label: "Entender exames", href: "/faq#saude" },
  },
  {
    id: "perguntas-frequentes",
    title: "Perguntas Frequentes",
    description:
      "Respostas diretas sobre investimento, logistica, convivio com criancas e integracao com outros pets.",
    highlight: "Conteudo didatico produzido com base nas duvidas reais dos tutores.",
    match: (post) => includesCategory(post, ["pergunta", "faq", "investimento", "logistica"]),
    cta: { label: "FAQ completo", href: "/faq" },
  },
];

const BLOG_SNIPPET =
  "O blog da By Império Dog reúne artigos sobre Spitz Alemão Anão (Lulu da Pomerânia) com foco em rotina, saúde, comportamento e decisões com pedigree. Cada texto responde perguntas reais de tutores e aponta para guias, FAQ e contato direto com a criadora.";

const BLOG_FAQ = [
  {
    question: "Como o blog ajuda a decidir um filhote?",
    answer:
      "Cada artigo cita evidências de socialização, saúde e investimento, relacionando perguntas frequentes a guias e ao catálogo de filhotes com pedigree.",
  },
  {
    question: "Os conteúdos são escritos por especialistas?",
    answer: "Sim, todos os textos passam pelo time By Império Dog e validam referências confiáveis antes da publicação.",
  },
  {
    question: "Posso compartilhar essas informações com minha família?",
    answer: "Claro, o blog foi pensado para familias e consultores, sempre mantendo a fonte Sanity como verdade editorial.",
  },
];

const HERO_LINKS = [
  {
    title: "Filhotes disponíveis sob consulta",
    description: "Acesso antecipado às ninhadas com saúde validada e mentoria vitalícia.",
    href: "/filhotes",
  },
  {
    title: "Processo By Império Dog",
    description: "Entenda cada etapa: entrevista, socialização, entrega humanizada e suporte 24h.",
    href: "/sobre#processo",
  },
  {
    title: "FAQ para tutores",
    description: "Perguntas frequentes sobre investimento, logística e rotina em família.",
    href: "/faq",
  },
];

export const revalidate = process.env.NODE_ENV === "production" ? 60 : 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = baseBlogMetadata({
  description:
    "Conteúdo evergreen e prático sobre saúde, rotina e comportamento do Spitz Alemão Anão (Lulu da Pomerânia).",
});

type PageSearchParams = {
  q?: string;
  sort?: SortOption;
  page?: string;
};

export default async function BlogListPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const sort = searchParams?.sort === "antigos" ? "antigos" : "recentes";
  const searchTerm = (searchParams?.q || "").trim();
  const pageNum = Math.max(1, Number(searchParams?.page || 1));
  const searchQuery = searchTerm.length >= 2 ? searchTerm : undefined;

  let pageData: PublicPostsPage | null = null;
  let fetchError: string | null = null;

  try {
    pageData = await listPublicPosts({
      page: pageNum,
      pageSize: 12,
      sort,
      search: searchQuery,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[blog] erro ao carregar posts do Sanity", error);
    }
    fetchError = error instanceof Error ? error.message : "Erro desconhecido";
  }

  if (!pageData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Hero searchTerm={searchTerm} links={HERO_LINKS} />
        <EmptyState
          title="Nao foi possivel carregar os artigos"
          message={fetchError || "Tente novamente em instantes."}
        />
      </div>
    );
  }

  if (!pageData.posts.length) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Hero searchTerm={searchTerm} links={HERO_LINKS} />
        <EmptyState
          title="Nenhum artigo publicado ainda"
          message="Assim que novos conteudos estiverem prontos, voce sera notificado nas redes sociais."
        />
      </div>
    );
  }

  const filtered = searchQuery
    ? pageData.posts
    : searchTerm
      ? pageData.posts.filter((post) => {
          const target = `${post.title} ${post.excerpt ?? ""} ${post.category ?? ""}`.toLowerCase();
          return target.includes(searchTerm.toLowerCase());
        })
      : pageData.posts;

  const featured = filtered[0] ?? pageData.posts[0];
  const collections = buildCollections(filtered);
  const guiaDoTutorCollection = collections.find((collection) => collection.definition.id === "guia-do-tutor");
  const otherCollections = collections.filter((collection) => collection.definition.id !== "guia-do-tutor");

  const metaTitleStr =
    typeof metadata.title === "string" ? metadata.title : "Blog | By Império Dog";
  const metaDescStr =
    metadata.description || "Conteúdo evergreen sobre saúde, rotina e comportamento do Spitz Alemão Anão (Lulu da Pomerânia).";
  const blogSchema = buildBlogSchema({
    url: SITE_ORIGIN,
    headline: metaTitleStr,
    description: metaDescStr,
    posts: pageData.posts.slice(0, 12),
  });

  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_ORIGIN}/blog` },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_ORIGIN}/blog#itemlist`,
    itemListElement: pageData.posts.map((post, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${SITE_ORIGIN}/blog/${post.slug}`,
      name: post.title,
    })),
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
      <SeoJsonLd data={[blogSchema, crumbs, itemList]} />
      <Hero searchTerm={searchTerm} links={HERO_LINKS} />
      <section
        className="mt-8 rounded-3xl border border-border bg-white p-6 shadow-sm"
        aria-labelledby="blog-answer-snippet"
        data-geo-answer="blog-hub"
      >
        <h2 id="blog-answer-snippet" className="text-xl font-semibold text-zinc-900">
          Pílula da resposta
        </h2>
        <p className="mt-3 text-sm text-text-muted">{BLOG_SNIPPET}</p>
      </section>
      {featured ? <FeaturedPost post={featured} /> : null}

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {searchTerm && filtered.length > 0 && `${filtered.length} artigo${filtered.length > 1 ? "s" : ""} encontrado${filtered.length > 1 ? "s" : ""} para "${searchTerm}"`}
        {searchTerm && filtered.length === 0 && `Nenhum artigo encontrado para "${searchTerm}"`}
      </div>

      {searchTerm && filtered.length === 0 ? (
        <EmptyState
          title="Nenhum artigo corresponde ao termo pesquisado"
          message="Use palavras-chave como saude, rotina, comportamento ou investimento."
        />
      ) : null}

      {guiaDoTutorCollection && guiaDoTutorCollection.posts.length > 0 && !searchTerm ? (
        <GuiaDoTutorSection collection={guiaDoTutorCollection} />
      ) : null}

      {otherCollections.map((collection) =>
        collection.posts.length > 0 ? <CategorySection key={collection.definition.id} collection={collection} /> : null
      )}

      <div className="mt-12 rounded-3xl border border-border bg-white p-6 shadow-sm">
        <FAQBlock items={BLOG_FAQ} />
      </div>

      <nav className="mx-auto mt-2 flex items-center justify-center gap-3">
        {pageData.hasPrev ? (
          <Link
            href={`/blog?${new URLSearchParams({
              q: searchTerm || "",
              sort,
              page: String(pageData.page - 1),
            })}`}
            className="rounded-pill border border-border px-4 py-2 text-sm"
          >
            Anteriores
          </Link>
        ) : null}
        <span className="text-xs text-text-soft">
          Pagina {pageData.page} de {Math.max(1, Math.ceil(pageData.total / pageData.pageSize))}
        </span>
        {pageData.hasNext ? (
          <Link
            href={`/blog?${new URLSearchParams({
              q: searchTerm || "",
              sort,
              page: String(pageData.page + 1),
            })}`}
            className="rounded-pill border border-border px-4 py-2 text-sm"
          >
            Proximos
          </Link>
        ) : null}
      </nav>

      <aside className="grid gap-6 rounded-3xl border border-border bg-surface p-8 shadow-soft sm:grid-cols-3">
        {HERO_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface-subtle p-5 transition hover:-translate-y-1 hover:border-brand/70"
          >
            <h3 className="text-base font-semibold text-text group-hover:text-brand">{link.title}</h3>
            <p className="text-sm text-text-muted">{link.description}</p>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Leia tambem</span>
          </Link>
        ))}
      </aside>
    </div>
  );
}

function includesCategory(post: PublicPost, tags: string[]) {
  const category = (post.category || "").toLowerCase();
  if (tags.some((tag) => category.includes(tag))) return true;
  const normalizedTags = post.tags ?? [];
  return normalizedTags.some((tag) => tags.includes(tag.toLowerCase()));
}

function buildCollections(posts: PublicPost[]) {
  const fallback = posts.filter((post) => !post.category);
  return CATEGORY_DEFINITIONS.map((definition) => {
    const filtered = posts.filter((post) => definition.match(post));
    const bucket =
      filtered.length > 0
        ? filtered
        : definition.id === "guia-do-tutor"
        ? fallback.length > 0
          ? fallback
          : posts
        : [];
    return { definition, posts: bucket.slice(0, 4) };
  });
}

function Hero({ searchTerm, links }: { searchTerm: string; links: Array<{ title: string; description: string; href: string }> }) {
  return (
    <header className="flex flex-col gap-8 rounded-3xl border border-border bg-surface p-8 shadow-soft sm:p-10 lg:flex-row lg:items-center">
      <div className="flex-1 space-y-4">
        <span className="inline-flex items-center gap-2 rounded-pill bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-brand">
          Conteúdo premium para tutores
        </span>
        <h1 className="text-3xl font-serif text-text sm:text-4xl">
          Blog By Império Dog: decisão com responsabilidade começa pelo conhecimento.
        </h1>
        <p className="text-sm text-text-muted">
          Damos transparência total sobre rotina, saúde e comportamento do Spitz Alemão Anão (Lulu da Pomerânia).
          Leia os pilares evergreen e avance para o formulário sob consulta quando estiver pronto.
        </p>
        <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="blog-search" className="sr-only">
            Pesquisar artigos
          </label>
          <input
            id="blog-search"
            name="q"
            defaultValue={searchTerm}
            placeholder="Buscar por saúde, rotina, comportamento..."
            className="flex-1 rounded-pill border border-border bg-surface-subtle px-5 py-3 text-sm text-text focus:ring-2 focus:ring-brand/30"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-pill bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-soft hover:bg-brand-600"
          >
            Pesquisar
          </button>
        </form>
      </div>
      <div className="grid flex-1 gap-4 sm:grid-cols-2">
        {links.slice(0, 2).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-surface-subtle p-5 transition hover:-translate-y-1 hover:border-brand/70"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Leia também</span>
            <h3 className="text-base font-semibold text-text group-hover:text-brand">{link.title}</h3>
            <p className="text-sm text-text-muted">{link.description}</p>
          </Link>
        ))}
      </div>
    </header>
  );
}

function FeaturedPost({ post }: { post: PublicPost }) {
  const formattedDate = formatDate(post.published_at || post.updated_at);
  const minutes = estimateReadingTime(post.content_mdx ?? post.excerpt ?? "");
  const href = `/blog/${post.slug}`;
  const coverUrl = normalizeCoverUrl(post.cover_url);

  return (
    <article className="relative grid gap-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-surface to-surface-subtle shadow-soft lg:grid-cols-[1.45fr,1fr]">
      <div className="order-2 flex flex-col justify-between gap-4 p-8 lg:order-1 lg:p-10">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-pill bg-brand/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            Destaque
          </span>
          <h2 className="text-3xl font-serif text-text">
            <Link href={href} className="transition hover:text-brand">
              {post.title}
            </Link>
          </h2>
          {post.excerpt ? <p className="text-sm text-text-muted">{post.excerpt}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-soft">
          {formattedDate ? <span>{formattedDate}</span> : null}
          {minutes ? (
            <span className="rounded-pill bg-surface-subtle px-3 py-1 font-semibold text-text">
              {minutes} min de leitura
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-pill bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground shadow-soft hover:bg-brand-600"
          >
            Ler artigo completo
          </Link>
          <Link
            href="/filhotes"
            className="inline-flex items-center justify-center rounded-pill border border-border px-5 py-2 text-sm font-semibold text-text hover:border-brand"
          >
            Ver filhotes sob consulta
          </Link>
        </div>
      </div>
      <div className="relative order-1 min-h-[240px] overflow-hidden bg-surface-subtle lg:order-2">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={post.cover_alt || post.title}
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-border/60 bg-surface px-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-text-soft">Destaque</span>
            <span className="max-w-[36ch] text-sm font-medium text-text-muted">
              Este artigo está sem imagem de capa.
            </span>
          </div>
        )}
        {coverUrl ? <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/0" /> : null}
      </div>
    </article>
  );
}

function normalizeCoverUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  const normalized = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  try {
    const url = new URL(normalized);
    if (url.protocol === "http:" || url.protocol === "https:") return normalized;
  } catch {
    return null;
  }
  return null;
}

function CategorySection({
  collection,
}: {
  collection: { definition: CategoryDefinition; posts: PublicPost[] };
}) {
  const { definition, posts } = collection;

  return (
    <section aria-labelledby={`categoria-${definition.id}`} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 id={`categoria-${definition.id}`} className="text-2xl font-serif text-text">
            {definition.title}
          </h2>
          <p className="max-w-2xl text-sm text-text-muted">{definition.description}</p>
        </div>
        <Link
          href={definition.cta.href}
          className="inline-flex items-center justify-center rounded-pill border border-border px-5 py-2 text-sm font-semibold text-text hover:border-brand"
        >
          {definition.cta.label}
        </Link>
      </div>

          <p className="text-sm font-semibold text-brand">{definition.highlight}</p>

      <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

function GuiaDoTutorSection({
  collection,
}: {
  collection: { definition: CategoryDefinition; posts: PublicPost[] };
}) {
  const { definition, posts } = collection;

  return (
    <section
      aria-labelledby="guia-tutor-heading"
      className="space-y-6 rounded-3xl border-2 border-brand/20 bg-gradient-to-br from-brand/5 via-surface to-surface p-8 shadow-lg"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-white">
            Guia do Tutor
          </span>
          <h2 id="guia-tutor-heading" className="text-3xl font-serif text-text">
            {definition.title}
          </h2>
          <p className="max-w-3xl text-base text-text-muted">{definition.description}</p>
        </div>
        <Link
          href={definition.cta.href}
          className="inline-flex items-center justify-center rounded-pill border border-brand/30 px-5 py-2 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/10"
        >
          {definition.cta.label}
        </Link>
      </div>

      <p className="text-sm font-semibold text-brand">{definition.highlight}</p>

      <div className="grid auto-rows-fr gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

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

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface-subtle px-6 py-10 text-center shadow-soft">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

function buildBlogSchema({
  url,
  headline,
  description,
  posts,
}: {
  url: string;
  headline: string;
  description: string;
  posts: PublicPost[];
}) {
  const base = url.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${base}/blog#blog`,
    mainEntityOfPage: `${base}/blog`,
    name: headline,
    description,
    publisher: {
      "@type": "Organization",
      name: "By Império Dog",
      url: base,
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${base}/blog/${post.slug}`,
      datePublished: post.published_at,
      image: post.cover_url ? [post.cover_url] : undefined,
    })),
  };
}
