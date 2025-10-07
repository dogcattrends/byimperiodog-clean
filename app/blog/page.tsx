import Image from "next/image";
import Link from "next/link";
import React from "react";

import PostCard from "@/components/blog/PostCard";
import SeoJsonLd from "@/components/SeoJsonLd";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { supabaseAnon } from "@/lib/supabaseAnon";

type BlogListReason = "ok" | "env-missing" | "no-published" | "error" | "empty-search";

type SortOption = "newest" | "oldest";

type PublicPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_url?: string | null;
  cover_alt?: string | null;
  published_at?: string | null;
  content_mdx?: string | null;
  status?: string | null;
};

type FetchOptions = {
  includeUnpublished: boolean;
  searchTerm?: string;
  sort?: SortOption;
};

type FetchResult = {
  posts: PublicPost[];
  total: number;
  error?: string;
  reason: BlogListReason;
};

async function fetchPosts(page: number, pageSize: number, opts: FetchOptions): Promise<FetchResult> {
  try {
    const sb = supabaseAnon();
    const envMissing = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (envMissing) {
      return { posts: [], total: 0, reason: "env-missing" };
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const sort = opts.sort ?? "newest";

    let query = sb
      .from("blog_posts")
      .select("id,slug,title,excerpt,cover_url,cover_alt,published_at,content_mdx,status", { count: "exact" })
      .order("published_at", { ascending: sort === "oldest" })
      .range(from, to);

    if (!opts.includeUnpublished) {
      query = query.eq("status", "published");
    } else {
      query = query.in("status", ["published", "review", "draft", "scheduled"]);
    }

    const searchTerm = opts.searchTerm?.trim();
    if (searchTerm) {
      const escaped = searchTerm.replace(/[%_]/g, (value) => `\\${value}`);
      const likeValue = `%${escaped}%`;
      query = query.or(`title.ilike.${likeValue},excerpt.ilike.${likeValue}`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const posts = (data as PublicPost[]) || [];
    if (!posts.length) {
      return { posts: [], total: 0, reason: opts.searchTerm ? "error" : "no-published" };
    }

    return { posts, total: count || posts.length, reason: "ok" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (process.env.NODE_ENV !== "production") {
      console.error("[blog] falha ao carregar posts", msg);
    }
    return { posts: [], total: 0, error: msg || "Erro desconhecido", reason: "error" };
  }
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormatter.format(date);
}

function buildQuery(current: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { ...current, ...overrides };
  Object.entries(merged)
    .filter(([, value]) => value != null && value !== "")
    .forEach(([key, value]) => params.set(key, value!));
  return `?${params.toString()}`;
}

export const revalidate = 300;

export const metadata = {
  title: "Blog",
  description: "Artigos e guias sobre cuidados, saúde e bem-estar do seu Spitz Alemão Anão Lulu da Pomerânia.",
};

type PageSearchParams = {
  page?: string;
  preview?: string;
  q?: string;
  sort?: SortOption;
};

export default async function BlogListPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const page = Math.max(1, Number(searchParams?.page || "1") || 1);
  const searchTerm = searchParams?.q?.trim() ?? "";
  const sortParam: SortOption = searchParams?.sort === "oldest" ? "oldest" : "newest";
  const previewMode = process.env.NODE_ENV !== "production" && searchParams?.preview === "1";
  const pageSize = 12;

  const currentQuery = {
    page: String(page),
    preview: previewMode ? "1" : undefined,
    q: searchTerm || undefined,
    sort: sortParam !== "newest" ? sortParam : undefined,
  };

  const { posts, total, reason } = await fetchPosts(page, pageSize, {
    includeUnpublished: previewMode,
    searchTerm,
    sort: sortParam,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: (page - 1) * pageSize + index + 1,
      url: `${site}/blog/${post.slug}`,
      name: post.title,
    })),
  };

  const featured = page === 1 && posts.length > 0 ? posts[0] : null;
  const remaining = featured ? posts.slice(1) : posts;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 lg:space-y-12 lg:px-0">
      <header className="flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Blog</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">Cuidando do seu Spitz com conhecimento de especialista</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Guias, dicas e insights para oferecer a melhor experiencia ao seu cao. Explore novidades, series especiais e conteudos sazonais preparados pelo time By Imperio Dog.
          </p>
          {previewMode ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
              Preview ativo &mdash; rascunhos, revisao e agendados visiveis
            </span>
          ) : null}
        </div>
        <form method="get" className="flex w-full flex-col gap-3 sm:max-w-md" role="search">
          {previewMode ? <input type="hidden" name="preview" value="1" /> : null}
          <label htmlFor="blog-search" className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Procurar artigos
          </label>
          <div className="relative flex items-center">
            <input
              id="blog-search"
              name="q"
              defaultValue={searchTerm}
              placeholder="Busque por palavra-chave, tema ou duvida"
              className="w-full rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-5 py-3 text-sm text-[var(--text)] shadow-inner outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
              type="search"
            />
            <button type="submit" className="absolute right-2 inline-flex h-9 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand/90">
              Buscar
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wide">Ordenar:</span>
            <Link
              href={buildQuery(currentQuery, { sort: undefined, page: "1" })}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${sortParam === "newest" ? "bg-brand text-white" : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]"}`}
            >
              Mais recentes
            </Link>
            <Link
              href={buildQuery(currentQuery, { sort: "oldest", page: "1" })}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${sortParam === "oldest" ? "bg-brand text-white" : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]"}`}
            >
              Mais antigos
            </Link>
          </div>
        </form>
      </header>

      <SeoJsonLd data={listLd} />

      {featured ? (
        <FeaturedPost post={featured} minutes={featured.content_mdx ? estimateReadingTime(featured.content_mdx) : null} previewMode={previewMode} />
      ) : null}

      {remaining.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {remaining.map((post, index) => {
            const minutes = post.content_mdx ? estimateReadingTime(post.content_mdx) : null;
            return (
              <PostCard
                key={post.id}
                href={`/blog/${post.slug}`}
                title={post.title}
                coverUrl={post.cover_url}
                coverAlt={post.cover_alt || post.title}
                excerpt={post.excerpt}
                date={post.published_at}
                readingTime={minutes}
                status={post.status}
                previewMode={previewMode}
                priorityImage={page === 1 && index < 2}
              />
            );
          })}
        </ul>
      ) : null}

      {remaining.length === 0 && !featured ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--text-muted)]">
          {reason === "env-missing" && (
            <p>
              Configuracao incompleta: defina <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> e <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            </p>
          )}
          {reason === "no-published" && !previewMode && (
            <p>
              Nenhum artigo publicado ainda. Use <code className="font-mono text-xs">?preview=1</code> em desenvolvimento para visualizar rascunhos.
            </p>
          )}
          {previewMode && reason === "no-published" && <p>Nenhum artigo (nem drafts/review) encontrado.</p>}
          {reason === "error" && <p>Erro ao carregar artigos. Tente novamente mais tarde.</p>          }
          {reason === "empty-search" && searchTerm && <p>Nenhum resultado para "{searchTerm}". Tente outros termos.</p>          }
          {!reason && <p>Nenhum artigo encontrado.</p>}
        </div>
      ) : null}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-2" aria-label="Paginacao do blog">
          {page > 1 ? (
            <Link
              href={buildQuery(currentQuery, { page: String(page - 1) })}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm transition-colors hover:bg-[var(--surface-2)]"
            >
              Anterior
            </Link>
          ) : null}
          <span className="text-xs text-[var(--text-muted)]">Pagina {page} de {totalPages}</span>
          {page < totalPages ? (
            <Link
              href={buildQuery(currentQuery, { page: String(page + 1) })}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm transition-colors hover:bg-[var(--surface-2)]"
            >
              Proxima
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

type FeaturedPostProps = {
  post: PublicPost;
  minutes: number | null;
  previewMode: boolean;
};

function FeaturedPost({ post, minutes, previewMode }: FeaturedPostProps) {
  const formattedDate = formatDate(post.published_at) || "Sem data definida";

  return (
    <article className="relative grid gap-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--surface-2)] shadow-md lg:grid-cols-[1.4fr,1fr]">
      <div className="relative order-2 flex flex-col gap-4 p-8 lg:order-1 lg:p-10">
        {previewMode && post.status && post.status !== "published" ? (
          <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            {post.status}
          </span>
        ) : null}
        <div className="space-y-2">
          <Link href={`/blog/${post.slug}`} className="text-3xl font-bold leading-tight text-[var(--text)] transition-colors hover:text-brand lg:text-[2.35rem]">
            {post.title}
          </Link>
          {post.excerpt ? <p className="text-base text-[var(--text-muted)]">{post.excerpt}</p> : null}
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span>{formattedDate}</span>
          {minutes ? (
            <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 font-semibold tracking-wide text-[var(--text)]">{minutes} min de leitura</span>
          ) : null}
        </div>
        <div className="mt-auto flex flex-wrap gap-3">
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:bg-brand/90"
          >
            Ler artigo completo
          </Link>
          <Link
            href={buildShareUrl(post.slug)}
            className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-5 py-2 text-sm font-semibold text-[var(--text)] shadow-sm transition-colors hover:bg-[var(--surface-2)]"
          >
            Compartilhar
          </Link>
        </div>
      </div>
      <div className="relative order-1 min-h-[260px] overflow-hidden bg-[var(--surface-2)] lg:order-2">
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt={post.cover_alt || post.title}
            fill
            priority
            sizes="(max-width:1024px) 100vw, 50vw"
            className="h-full w-full object-cover transition-transform duration-700 will-change-transform hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Sem imagem destacada
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/0"></div>
      </div>
    </article>
  );
}

function buildShareUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br";
  return `${base.replace(/\/$/, "")}/blog/${slug}`;
}



