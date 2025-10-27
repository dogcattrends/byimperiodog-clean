import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import BlogCard from "@/components/blog/BlogCard";
import SeoJsonLd from "@/components/SeoJsonLd";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { BLUR_DATA_URL } from "@/lib/placeholders";
import { supabaseAnon } from "@/lib/supabaseAnon";

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
  status?: string | null;
  category?: string | null;
  author_id?: string | null;
  tags?: string[] | null;
};

type FetchState =
  | { status: "ok"; posts: PublicPost[] }
  | { status: "empty" }
  | { status: "env-missing" }
  | { status: "error"; message: string };

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
      "Rotinas, enxoval, planejamento financeiro e a jornada completa para receber um Spitz equilibrado em casa.",
    highlight: "Checklist premium e mentoria vitalícia para famílias exigentes.",
    match: (post) => includesCategory(post, ["guia", "tutor", "planejamento"]),
    cta: { label: "Planejar rotina", href: "/sobre" },
  },
  {
    id: "cuidados",
    title: "Cuidados",
    description:
      "Nutrição personalizada, higiene estratégica e protocolos preventivos para manter o Spitz saudável e confiante.",
    highlight: "Orientações da neonatologia ao primeiro ano com suporte contínuo.",
    match: (post) => includesCategory(post, ["cuidado", "rotina", "nutri", "higiene"]),
    cta: { label: "Ver dicas de cuidados", href: "/faq#cuidados" },
  },
  {
    id: "adestramento",
    title: "Adestramento",
    description:
      "Socialização guiada, enriquecimento ambiental e reforço positivo focado em lares urbanos com agenda cheia.",
    highlight: "Protocolos semanais com vídeos e check-ins pelo WhatsApp.",
    match: (post) => includesCategory(post, ["adestramento", "comportamento", "socializacao"]),
    cta: { label: "Conhecer nosso processo", href: "/sobre#processo" },
  },
  {
    id: "saude",
    title: "Saúde",
    description:
      "Preventivo completo: exames genéticos, cardiológicos e protocolos veterinários para Spitz até 22 cm.",
    highlight: "Transparência total com laudos digitais e acompanhamento pós-entrega.",
    match: (post) => includesCategory(post, ["saude", "clínico", "veterin", "check-up"]),
    cta: { label: "Entender exames", href: "/faq#saude" },
  },
  {
    id: "perguntas-frequentes",
    title: "Perguntas Frequentes",
    description:
      "Respostas diretas sobre investimento, logística, convivência com crianças e integração com outros pets.",
    highlight: "Conteúdo didático produzido com base nas dúvidas reais dos tutores.",
    match: (post) => includesCategory(post, ["pergunta", "faq", "investimento", "logistica"]),
    cta: { label: "FAQ completo", href: "/faq" },
  },
];

// Revalidate cache every 60 seconds in production, but disable cache in development
export const revalidate = process.env.NODE_ENV === 'production' ? 60 : 0;
// Force dynamic rendering to always show latest posts
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Guia completo do tutor de Spitz Alemão Anão (Lulu da Pomerânia)",
  description:
    "Conteúdo evergreen para quem busca Spitz Alemão Anão (Lulu da Pomerânia) com responsabilidade: cuidados, rotina, comportamento, saúde preventiva e respostas das principais dúvidas.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "Blog | By Império Dog",
    description:
      "Pilares evergreen sobre saúde, rotina e comportamento do Spitz Alemão Anão (Lulu da Pomerânia) para uma decisão responsável.",
  },
};

type PageSearchParams = {
  q?: string;
  sort?: SortOption;
};

export default async function BlogListPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const sort = searchParams?.sort === "antigos" ? "antigos" : "recentes";
  const searchTerm = (searchParams?.q || "").trim();
  const fetchState = await fetchPosts(sort);

  const heroLinks = [
    {
      title: "Filhotes disponíveis sob consulta",
      description: "Acesso antecipado às ninhadas com saúde validada e mentoria vitalícia.",
      href: "/filhotes",
    },
    {
      title: "Processo By Imperio Dog",
      description: "Entenda cada etapa: entrevista, socialização, entrega humanizada e suporte 24h.",
      href: "/sobre#processo",
    },
    {
      title: "FAQ para tutores",
      description: "Perguntas frequentes sobre investimento, logística e rotina em família.",
      href: "/faq",
    },
  ];

  if (fetchState.status === "env-missing") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Hero searchTerm={searchTerm} links={heroLinks} />
        <EmptyState
          title="Configuração necessária"
          message="Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar o blog."
        />
      </div>
    );
  }

  if (fetchState.status === "error") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Hero searchTerm={searchTerm} links={heroLinks} />
        <EmptyState
          title="Não foi possível carregar os artigos"
          message={fetchState.message || "Tente novamente em instantes."}
        />
      </div>
    );
  }

  if (fetchState.status === "empty") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Hero searchTerm={searchTerm} links={heroLinks} />
        <EmptyState
          title="Nenhum artigo publicado ainda"
          message="Assim que novos conteúdos estiverem prontos, você será notificado nas redes sociais."
        />
      </div>
    );
  }

  const filtered = searchTerm
    ? fetchState.posts.filter((post) => {
        const target = `${post.title} ${post.excerpt ?? ""} ${post.category ?? ""}`.toLowerCase();
        return target.includes(searchTerm.toLowerCase());
      })
    : fetchState.posts;

  const featured = filtered[0] ?? fetchState.posts[0];
  const collections = buildCollections(filtered);

  const metaTitleStr = typeof metadata.title === "string" ? metadata.title : "Blog | By Império Dog";
  const metaDescStr = metadata.description ?? "Conteúdo evergreen sobre saúde, rotina e comportamento do Spitz Alemão Anão (Lulu da Pomerânia).";
  const blogSchema = buildBlogSchema({
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br",
    headline: metaTitleStr,
    description: metaDescStr,
    posts: fetchState.posts.slice(0, 12),
  });

  // Separar "Guia do Tutor" para destaque
  const guiaDoTutorCollection = collections.find(c => c.definition.id === "guia-do-tutor");
  const otherCollections = collections.filter(c => c.definition.id !== "guia-do-tutor");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
      <SeoJsonLd data={blogSchema} />
      <Hero searchTerm={searchTerm} links={heroLinks} />
      {featured ? <FeaturedPost post={featured} /> : null}

      {/* Anúncio de resultados para leitores de tela */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {searchTerm && filtered.length > 0 && `${filtered.length} artigo${filtered.length > 1 ? 's' : ''} encontrado${filtered.length > 1 ? 's' : ''} para "${searchTerm}"`}
        {searchTerm && filtered.length === 0 && `Nenhum artigo encontrado para "${searchTerm}"`}
      </div>

      {searchTerm && filtered.length === 0 ? (
        <EmptyState
          title="Nenhum artigo corresponde ao termo pesquisado"
          message="Use palavras-chave como saúde, rotina, comportamento ou investimento."
        />
      ) : null}

      {/* Guia do Tutor em destaque */}
      {guiaDoTutorCollection && guiaDoTutorCollection.posts.length > 0 && !searchTerm ? (
        <GuiaDoTutorSection collection={guiaDoTutorCollection} />
      ) : null}

      {otherCollections.map((collection) =>
        collection.posts.length > 0 ? (
          <CategorySection key={collection.definition.id} collection={collection} />
        ) : null
      )}

      <aside className="grid gap-6 rounded-3xl border border-border bg-surface p-8 shadow-soft sm:grid-cols-3">
        {heroLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface-subtle p-5 transition hover:-translate-y-1 hover:border-brand/70"
          >
            <h3 className="text-base font-semibold text-text group-hover:text-brand">{link.title}</h3>
            <p className="text-sm text-text-muted">{link.description}</p>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
              Leia também
            </span>
          </Link>
        ))}
      </aside>
    </div>
  );
}

function includesCategory(post: PublicPost, tags: string[]) {
  const category = (post.category || "").toLowerCase();
  const hasTag = tags.some((tag) => category.includes(tag));
  if (hasTag) return true;
  const normalizedTags = (post.tags ?? []) as string[] | undefined;
  return normalizedTags ? normalizedTags.some((tag) => tags.includes(tag.toLowerCase())) : false;
}

async function fetchPosts(sort: SortOption): Promise<FetchState> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return { status: "env-missing" };
    }

    const sb = supabaseAnon();
    const query = sb
      .from("blog_posts")
      .select(
        "id,slug,title,excerpt,cover_url,cover_alt,published_at,updated_at,content_mdx,status,category,tags,author_id",
        { count: "exact" }
      )
      .eq("status", "published")
      .order("published_at", { ascending: sort === "antigos" })
      .limit(60);

    const { data, error } = await query;
    if (error) throw error;

    const raw = (data ?? []) as Partial<PublicPost>[];
    const posts = raw.filter((item): item is PublicPost => Boolean(item.slug && item.title));
    if (posts.length === 0) {
      return { status: "empty" };
    }

    return {
      status: "ok",
      posts: sort === "antigos" ? posts : posts.sort(descByDate),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    if (process.env.NODE_ENV !== "production") {
      console.error("[blog] falha ao carregar posts", message);
    }
    return { status: "error", message };
  }
}

function descByDate(a: PublicPost, b: PublicPost) {
  const dateA = new Date(a.published_at ?? a.updated_at ?? 0).getTime();
  const dateB = new Date(b.published_at ?? b.updated_at ?? 0).getTime();
  return dateB - dateA;
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
          Blog By Imperio Dog: decisão com responsabilidade começa pelo conhecimento.
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
        {post.cover_url ? (
          <Image
            src={post.cover_url}
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
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase tracking-[0.28em] text-text-soft">
            Conteúdo exclusivo
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/0" />
      </div>
    </article>
  );
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

      <p className="text-xs uppercase tracking-[0.3em] text-brand">{definition.highlight}</p>

      <div className="grid auto-rows-fr gap-6 md:grid-cols-2">
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
      name: "By Imperio Dog",
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


