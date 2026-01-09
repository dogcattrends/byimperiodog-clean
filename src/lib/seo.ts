import type { Metadata } from "next";

import { supabasePublic } from "./supabasePublic";

// ============================================================================
// CONSTANTS
// ============================================================================

export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
export const SITE_BRAND_NAME = "By Imperio Dog";

// ============================================================================
// CANONICAL URL HELPERS
// ============================================================================

export function canonical(path: string) {
  if (!path) return SITE_ORIGIN;
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildCanonical(path: string) {
  if (!path) return canonical("/");
  if (/^https?:\/\//i.test(path)) return path;
  return canonical(path);
}

// ============================================================================
// TYPES
// ============================================================================

type OgImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

type ImageLike = string | OgImage;

export interface PageMetadataInput {
  title: string | Metadata["title"];
  description?: string;
  path?: string;
  images?: ImageLike[];
  robots?: Metadata["robots"];
  keywords?: string[];
  openGraph?: Metadata["openGraph"];
  twitter?: Metadata["twitter"];
  alternates?: Metadata["alternates"];
  other?: Metadata["other"];
}

// ============================================================================
// ROBOTS CONFIGURATION
// ============================================================================

const PREVIEW_ENVS = new Set(["preview", "development", "test"]);

const DEFAULT_IMAGE: Required<OgImage> = {
  url: "/spitz-hero-desktop.webp",
  width: 1200,
  height: 630,
  alt: "Spitz Alemão (Lulu da Pomerânia) — By Imperio Dog",
};

const ROBOTS_DEFAULT: NonNullable<Metadata["robots"]> = {
  index: true,
  follow: true,
  "max-snippet": -1,
  "max-image-preview": "large",
  "max-video-preview": -1,
  googleBot: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
};

const ROBOTS_PREVIEW: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  noarchive: true,
  noimageindex: true,
  nosnippet: true,
  googleBot: {
    index: false,
    follow: false,
    noarchive: true,
    noimageindex: true,
    nosnippet: true,
  },
};

function mergeRobots(base: NonNullable<Metadata["robots"]>, overrides: NonNullable<Metadata["robots"]>) {
  if (typeof overrides === "string") return overrides;
  if (typeof base === "string") return overrides;
  const baseGoogleBot = base.googleBot;
  const overrideGoogleBot = overrides.googleBot;
  let googleBot = baseGoogleBot;

  if (overrideGoogleBot) {
    if (typeof overrideGoogleBot === "string") {
      googleBot = overrideGoogleBot;
    } else if (!baseGoogleBot || typeof baseGoogleBot === "string") {
      googleBot = { ...overrideGoogleBot };
    } else {
      googleBot = { ...baseGoogleBot, ...overrideGoogleBot };
    }
  }

  return {
    ...base,
    ...overrides,
    googleBot,
  };
}

export function resolveRobots(overrides?: Metadata["robots"]) {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || "";
  const base = PREVIEW_ENVS.has(env) ? ROBOTS_PREVIEW : ROBOTS_DEFAULT;
  if (!overrides) return base;
  if (typeof overrides === "string") return overrides;
  return mergeRobots(base, overrides);
}

// ============================================================================
// BASE METADATA BUILDERS
// ============================================================================

export function baseSiteMetadata(overrides: Partial<Metadata> = {}): Metadata {
  const title = overrides.title || { default: `Spitz Alemão Anão | ${SITE_BRAND_NAME}`, template: `%s | ${SITE_BRAND_NAME}` };
  const description = overrides.description || "Filhotes legítimos, entrega responsável e pós-venda acolhedor.";
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description,
    authors: [{ name: SITE_BRAND_NAME, url: SITE_ORIGIN }],
    creator: SITE_BRAND_NAME,
    publisher: SITE_BRAND_NAME,
    alternates: { canonical: SITE_ORIGIN + "/" },
    openGraph: {
      type: "website",
      url: SITE_ORIGIN + "/",
      siteName: SITE_BRAND_NAME,
      images: [{ url: "/spitz-hero-desktop.webp", width: 1200, height: 630, alt: `Spitz Alemão Anão | ${SITE_BRAND_NAME}` }],
      ...overrides.openGraph,
    },
    twitter: { card: "summary_large_image", ...(overrides.twitter || {}) },
    ...overrides,
  } as Metadata;
}

export function baseBlogMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    title: "Blog | By Imperio Dog",
    description: "Conteúdo especializado sobre Spitz Alemão, saúde, adestramento e bem-estar.",
    alternates: { canonical: canonical("/blog") },
    openGraph: {
      type: "website",
      url: canonical("/blog"),
      siteName: SITE_BRAND_NAME,
      title: "Blog | By Imperio Dog",
      description: "Conteúdo especializado sobre Spitz Alemão, saúde, adestramento e bem-estar.",
      ...overrides.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: "Blog | By Imperio Dog",
      description: "Conteúdo sobre Spitz Alemão e bem-estar.",
      ...(overrides.twitter || {}),
    },
    ...overrides,
  } as Metadata;
}

export function buildBlogPostMetadata({
  slug,
  title,
  description,
  image,
  published,
}: {
  slug: string;
  title: string;
  description?: string | null;
  image?: string | null;
  published?: string | null;
}): Metadata {
  const url = canonical(`/blog/${slug}`);
  return {
    title,
    description: description || undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description: description || undefined,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || undefined,
      images: image ? [image] : undefined,
    },
    other: published ? { "article:published_time": published } : undefined,
  } as Metadata;
}

export async function buildPostMetadata(slug: string): Promise<Metadata> {
  const sb = supabasePublic();
  const { data: post } = await sb
    .from("blog_posts")
    .select("id,slug,title,excerpt,cover_url,og_image_url, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const url = canonical(`/blog/${post?.slug ?? slug}`);
  let override: Record<string, unknown> | null = null;
  if (post?.id) {
    const { data: ovr } = await sb.from("seo_overrides").select("data_json").eq("entity_type", "post").eq("entity_id", post.id).maybeSingle();
    override = (ovr?.data_json as Record<string, unknown>) || null;
  }

  const title = (override?.title as string) ?? post?.title ?? "Post | Blog";
  const description = (override?.description as string) ?? post?.excerpt ?? undefined;
  const image = (override?.og_image_url as string) ?? post?.og_image_url ?? post?.cover_url ?? undefined;
  const canonicalFinal = (override?.canonical as string) ?? url;
  const robots = override?.robots as string | undefined;
  const published = post?.published_at || undefined;

  return {
    title,
    description,
    alternates: { canonical: canonicalFinal },
    robots,
    openGraph: {
      type: "article",
      url: canonicalFinal,
      title,
      description,
      images: image ? [{ url: image as string, width: 1200, height: 630 }] : undefined,
    },
    twitter: image ? { card: "summary_large_image", images: [image as string] } : undefined,
    other: published ? { "article:published_time": published } : undefined,
  } as Metadata;
}

// ============================================================================
// PAGE METADATA
// ============================================================================

export function baseMetaOverrides(pathname: string): Partial<Metadata> {
  const canonical = buildCanonical(pathname || "/");
  return {
    alternates: { canonical },
    openGraph: { url: canonical },
  };
}

export function pageMetadata(input: PageMetadataInput): Metadata {
  const path = input.path ?? "/";
  const canonical = buildCanonical(path);
  const images = normalizeImages(input.images);
  const robots = resolveRobots(input.robots);

  const openGraph = {
    type: "website" as const,
    url: canonical,
    title: typeof input.title === "string" ? input.title : undefined,
    description: input.description,
    images,
    ...input.openGraph,
  };

  const twitter = {
    card: "summary_large_image" as const,
    title: typeof input.title === "string" ? input.title : undefined,
    description: input.description,
    images: images.map((image) => image.url),
    ...input.twitter,
  };

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: input.title,
    description: input.description,
    authors: [{ name: SITE_BRAND_NAME, url: SITE_ORIGIN }],
    creator: SITE_BRAND_NAME,
    publisher: SITE_BRAND_NAME,
    robots,
    keywords: input.keywords,
    alternates: {
      canonical,
      ...input.alternates,
    },
    openGraph,
    twitter,
    other: input.other,
  };
}

function normalizeImages(images?: ImageLike[]): OgImage[] {
  if (!images || images.length === 0) {
    return [DEFAULT_IMAGE];
  }

  return images.map((image) => {
    if (typeof image === "string") {
      return {
        ...DEFAULT_IMAGE,
        url: image,
      };
    }

    return {
      url: image.url,
      width: image.width ?? DEFAULT_IMAGE.width,
      height: image.height ?? DEFAULT_IMAGE.height,
      alt: image.alt ?? DEFAULT_IMAGE.alt,
    };
  });
}

// ============================================================================
// JSON-LD SCHEMAS
// ============================================================================

export function blogJsonLdOrg() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "By Imperio Dog - Blog",
    url: canonical("/blog"),
    description: "Artigos sobre Spitz Alemão, cuidados, genética e qualidade de vida.",
  };
}

export function buildAuthorJsonLd(author: { name: string; slug: string; avatar_url?: string | null; bio?: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: canonical(`/autores/${author.slug}`),
    image: author.avatar_url || undefined,
    description: author.bio || undefined,
  };
}

// ============================================================================
// ADMIN/INTERNAL METADATA
// ============================================================================

export const adminNoIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};

// Re-export helpers from schema module for backward compatibility
export { blogPostingSchema } from "./schema";
