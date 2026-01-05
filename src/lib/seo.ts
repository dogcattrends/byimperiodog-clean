import type { Metadata } from "next";

import { canonical as resolveCanonical, SITE_BRAND_NAME, SITE_ORIGIN } from "./seo.core";

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

export function buildCanonical(path: string) {
  if (!path) return resolveCanonical("/");
  if (/^https?:\/\//i.test(path)) return path;
  return resolveCanonical(path);
}

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
