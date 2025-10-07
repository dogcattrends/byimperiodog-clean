
export interface CustomPixelConfig {
  id: string;
  label: string;
  slot: 'head' | 'body';
  enabled: boolean;
  code: string;
  noscript?: string;
}

export interface TrackingIDs {
  gtm: string;
  ga4: string;
  fb: string;
  tiktok: string;
  pinterest: string;
  hotjar: string;
  clarity: string;
  metaVerify: string;
  siteUrl: string;
  custom: CustomPixelConfig[];
}

function norm(v: unknown): string {
  if (!v) return "";
  return String(v).trim();
}

export function resolveTracking(settings: Record<string, unknown> | null | undefined, env = process.env): TrackingIDs {
  const rawCustom = Array.isArray(settings?.custom_pixels) ? settings?.custom_pixels : [];
  const custom: CustomPixelConfig[] = rawCustom
    .map((item: any, index: number) => {
      if (!item) return null;
      const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `custom-${index + 1}`;
      const label = typeof item.label === 'string' ? item.label.trim() : `Pixel ${index + 1}`;
      const slot = item.slot === 'body' ? 'body' : 'head';
      const enabled = item.enabled === false ? false : true;
      const code = typeof item.code === 'string' ? item.code.trim() : '';
      const noscript = typeof item.noscript === 'string' ? item.noscript.trim() : undefined;
      if (!code || !label) return null;
      return { id, label, slot, enabled, code, noscript } satisfies CustomPixelConfig;
    })
    .filter((item): item is CustomPixelConfig => Boolean(item));

  return {
    gtm: norm(settings?.gtm_id ?? env.NEXT_PUBLIC_GTM_ID),
    ga4: norm(settings?.ga4_id ?? env.NEXT_PUBLIC_GA4_ID),
    fb: norm(settings?.meta_pixel_id ?? env.NEXT_PUBLIC_META_PIXEL_ID),
    tiktok: norm(settings?.tiktok_pixel_id ?? env.NEXT_PUBLIC_TIKTOK_PIXEL_ID),
    pinterest: norm(settings?.pinterest_tag_id ?? env.NEXT_PUBLIC_PINTEREST_TAG_ID),
    hotjar: norm(settings?.hotjar_id ?? env.NEXT_PUBLIC_HOTJAR_ID),
    clarity: norm(settings?.clarity_id ?? env.NEXT_PUBLIC_CLARITY_ID),
    metaVerify: norm(settings?.meta_domain_verify ?? env.NEXT_PUBLIC_META_DOMAIN_VERIFY),
    siteUrl: norm(env.NEXT_PUBLIC_SITE_URL) || "https://www.byimperiodog.com.br",
    custom,
  };
}

export function buildOrganizationLD(siteUrl: string) {
  const base = siteUrl.endsWith('/') ? siteUrl.slice(0,-1) : siteUrl;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}#organization`,
    name: "By Imperio Dog",
    url: `${base}/`,
    logo: `${base}/byimperiologo.png`,
    image: `${base}/spitz-hero-desktop.webp`,
    telephone: "+55 11 98663-3239",
    sameAs: [
      "https://instagram.com/byimperiodog",
      "https://www.youtube.com/@byimperiodog",
      "https://www.tiktok.com/@byimperiodog",
      "https://www.facebook.com/byimperiodog",
      "https://www.linkedin.com/company/byimperiodog",
      "https://twitter.com/byimperiodog"
    ],
    foundingDate: "2023-01-01",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BR",
      addressRegion: "SP",
      addressLocality: "São Paulo",
      postalCode: "01000-000"
    }
  };
}

export function buildWebsiteLD(siteUrl: string) {
  const clean = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${clean}#website`,
    name: "By Imperio Dog",
    url: `${clean}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${clean}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

// (Opcional) util para decidir se deve carregar trackers antes de consentimento.
export function shouldLoadImmediate(ids: TrackingIDs) {
  // Hoje carregamos sempre se existir ID. Poderia adicionar lógica de consent aqui.
  return ids;
}
