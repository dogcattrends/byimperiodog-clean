import type { Metadata } from 'next';

import { canonical as canonicalUtil, SITE_ORIGIN } from './seo.core';

// Detecta se ambiente é preview/staging para ajustar robots
export function resolveRobots() {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV;
  if (env && ['preview', 'development', 'test'].includes(env)) {
    return { index: false, follow: false }; // evita indexar builds provisórias
  }
  return { index: true, follow: true };
}

export function buildCanonical(path: string) {
  return canonicalUtil(path || '/');
}

export function baseMetaOverrides(pathname: string): Partial<Metadata> {
  const url = buildCanonical(pathname || '/');
  return { alternates: { canonical: url }, openGraph: { url } };
}

/**
 * Helper para construir Metadata de página com defaults consistentes.
 * - Define title/description
 * - Ajusta canonical (alternates) e Open Graph/Twitter
 */
export function pageMetadata({
  title,
  description,
  path = '/',
  images,
  robots,
}: {
  title: string | Metadata['title'];
  description?: string;
  path?: string;
  images?: Array<{ url: string; width?: number; height?: number; alt?: string }> | string[];
  robots?: Metadata['robots'];
}): Metadata {
  const canonical = buildCanonical(path || '/');
  const ogImages = Array.isArray(images)
    ? images.map((img) => (typeof img === 'string' ? { url: img } : img))
    : [{ url: '/spitz-hero-desktop.webp', width: 1200, height: 630, alt: 'Spitz Alemão (Lulu da Pomerânia) — By Imperio Dog' }];
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description,
    robots,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: typeof title === 'string' ? title : undefined,
      description,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: typeof title === 'string' ? title : undefined,
      description,
      images: ogImages.map((i) => i.url),
    },
  } as Metadata;
}

