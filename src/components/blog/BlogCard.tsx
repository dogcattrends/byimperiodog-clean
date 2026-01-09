"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { BLOG_CARD_SIZES } from "@/lib/image-sizes";
import { BLUR_DATA_URL } from "@/lib/placeholders";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type BlogCardPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_url?: string | null;
  cover_alt?: string | null;
  published_at?: string | null;
  content_mdx?: string | null;
};

type BlogCardProps = {
  post: BlogCardPost;
};

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

function estimateMinutes(content?: string | null) {
  if (!content) return null;
  const words = content.split(/\s+/).filter(Boolean).length;
  if (!words) return null;
  return Math.max(1, Math.round(words / 180));
}

export default function BlogCard({ post }: BlogCardProps) {
  const articleHref = `/blog/${post.slug}`;
  const minutes = estimateMinutes(post.content_mdx ?? post.excerpt ?? "");
  const published = formatDate(post.published_at);
  const coverUrl = normalizeCoverUrl(post.cover_url);

  const whatsappLink = buildWhatsAppLink({
    message: `Olá! Acabei de ler "${post.title}" e gostaria de receber orientação sobre Spitz Alemão Anão.`,
    utmSource: "site",
    utmMedium: "blog_card",
    utmCampaign: "blog_lead",
    utmContent: post.slug,
  });

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-brand/60 focus-within:ring-offset-2 focus-within:ring-offset-[var(--surface)]"
      aria-labelledby={`blog-card-title-${post.slug}`}
    >
      <Link href={articleHref} className="absolute inset-0" aria-label={post.title} tabIndex={-1} />

      <figure className="relative aspect-[4/3] w-full overflow-hidden bg-surface-subtle">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={post.cover_alt || post.title}
            fill
            sizes={BLOG_CARD_SIZES}
            className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.04]"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-border/60 bg-surface px-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-text-soft">Conteúdo evergreen</span>
            <span className="max-w-[28ch] text-sm font-medium text-text-muted">
              Este artigo não possui imagem de capa.
            </span>
          </div>
        )}

        {coverUrl ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 via-black/0" />
        ) : null}

        {coverUrl && published ? (
          <span className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-[10px] font-semibold tracking-wide text-white">
            {published}
          </span>
        ) : null}

        {coverUrl && minutes ? (
          <span className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1 text-[10px] font-semibold tracking-wide text-white">
            {minutes} min
          </span>
        ) : null}
      </figure>

      <div className="relative flex flex-1 flex-col gap-4 p-6">
        <header className="space-y-2">
          <h3
            id={`blog-card-title-${post.slug}`}
            className="line-clamp-2 text-lg font-semibold text-text group-hover:text-brand group-focus:text-brand transition-colors"
          >
            <Link
              href={articleHref}
              className="relative z-10 rounded-sm transition hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {post.title}
            </Link>
          </h3>
          {post.excerpt ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-text-muted">{post.excerpt}</p>
          ) : null}
        </header>

        <div className="mt-auto flex items-center justify-between gap-3">
          <Link
            href={articleHref}
            className="relative z-10 inline-flex min-h-[44px] items-center gap-2 rounded-pill px-1 text-sm font-semibold text-text transition-colors hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label={`Ler artigo: ${post.title}`}
          >
            Ler artigo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-border bg-surface-subtle px-3 text-sm font-semibold text-text transition hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            title="Tirar dúvidas sobre este artigo no WhatsApp"
            aria-label={`WhatsApp: dúvidas sobre ${post.title}`}
          >
            <WhatsAppIcon className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  );
}
