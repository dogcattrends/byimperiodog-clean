import type { Metadata } from 'next';

import { canonical as canonicalUtil } from './seo.core';

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

