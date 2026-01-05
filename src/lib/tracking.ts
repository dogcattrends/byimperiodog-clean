/* eslint-disable @typescript-eslint/no-unused-vars, no-empty */
type TrackingEvent = "page_view" | "view_form" | "submit_start" | "submit_success" | "submit_error";

function safePushToDataLayer(event: string, payload: object = {}) {
  try {
    // GTM/GA4 via dataLayer
    const w = window as unknown as {
      dataLayer?: Array<object>;
      fbq?: (...args: unknown[]) => void;
      ttq?: { track?: (...args: unknown[]) => void };
    };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...(payload as any) });
  } catch (_) {}
  try {
    // Facebook Pixel
    const wfb = window as unknown as { fbq?: (...args: unknown[]) => void };
    if (typeof wfb.fbq === "function") {
      wfb.fbq!("trackCustom", event, payload);
    }
  } catch (_) {}
  try {
    // TikTok Pixel
    const wtt = window as unknown as { ttq?: { track?: (...args: unknown[]) => void } };
    if (wtt.ttq && typeof wtt.ttq.track === "function") {
      wtt.ttq.track!(event, payload);
    }
  } catch (_) {}
}

export function track(event: TrackingEvent, payload: object = {}) {
  safePushToDataLayer(event, payload);
}

export function trackPageView(context: object) {
  track("page_view", context);
}

export function trackFormView(context: object) {
  track("view_form", context);
}

export function trackSubmitStart(context: object) {
  track("submit_start", context);
}

export function trackSubmitSuccess(context: object) {
  track("submit_success", context);
}

export function trackSubmitError(context: object) {
  track("submit_error", context);
}

import { BRAND } from "@/domain/config";
import type { PixelEnvironmentConfig } from "@/lib/pixels";

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
  googleVerify: string;
  siteUrl: string;
  custom: CustomPixelConfig[];
}

function norm(v: unknown): string {
  if (!v) return "";
  const str = String(v).trim();
  // Rejeita placeholders comuns
  if (/^(GTM-X+|G-X+|UA-X+|X+|xxx+|NaN|undefined|null)$/i.test(str)) return "";
  return str;
}

export function resolveTracking(
  settings: object | null | undefined,
  pixelConfig: PixelEnvironmentConfig | null | undefined = null,
  env = process.env,
): TrackingIDs {
  const config = pixelConfig ?? null;
  const s = settings as Record<string, unknown> | null;
  const rawCustom = Array.isArray(s?.custom_pixels as unknown) ? (s?.custom_pixels as unknown as unknown[]) : [];
  const custom: CustomPixelConfig[] = rawCustom
    .map((item: unknown, index: number): CustomPixelConfig | undefined => {
      const it = item as Record<string, unknown> | undefined;
      if (!it) return undefined;
      const id = typeof it.id === 'string' && it.id.trim() ? it.id.trim() : `custom-${index + 1}`;
      const label = typeof it.label === 'string' ? it.label.trim() : `Pixel ${index + 1}`;
      const slot = (it.slot as string) === 'body' ? 'body' as const : 'head' as const;
      const enabled = it.enabled === false ? false : true;
      const code = typeof it.code === 'string' ? it.code.trim() : '';
      const noscript = typeof it.noscript === 'string' ? it.noscript.trim() : undefined;
      if (!enabled || !code || !label) return undefined;
      return { id, label, slot, enabled, code, noscript } as CustomPixelConfig;
    })
    .filter((item): item is CustomPixelConfig => item !== undefined);
  return {
    gtm: norm(config?.gtmId ?? (s?.gtm_id as string | undefined) ?? env.NEXT_PUBLIC_GTM_ID),
    ga4: norm(config?.ga4Id ?? (s?.ga4_id as string | undefined) ?? env.NEXT_PUBLIC_GA4_ID),
    fb: norm(config?.metaPixelId ?? (s?.meta_pixel_id as string | undefined) ?? env.NEXT_PUBLIC_META_PIXEL_ID),
    tiktok: norm(config?.tiktokPixelId ?? (s?.tiktok_pixel_id as string | undefined) ?? env.NEXT_PUBLIC_TIKTOK_PIXEL_ID),
    pinterest: norm(config?.pinterestId ?? (s?.pinterest_tag_id as string | undefined) ?? env.NEXT_PUBLIC_PINTEREST_TAG_ID),
    hotjar: norm(config?.hotjarId ?? (s?.hotjar_id as string | undefined) ?? env.NEXT_PUBLIC_HOTJAR_ID),
    clarity: norm(config?.clarityId ?? (s?.clarity_id as string | undefined) ?? env.NEXT_PUBLIC_CLARITY_ID),
    metaVerify: norm(config?.metaDomainVerification ?? (s?.meta_domain_verify as string | undefined) ?? env.NEXT_PUBLIC_META_DOMAIN_VERIFY),
    googleVerify: norm((s?.google_site_verify as string | undefined) ?? env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION),
    siteUrl: norm(env.NEXT_PUBLIC_SITE_URL) || "https://www.byimperiodog.com.br",
    custom,
  };
}

export function buildOrganizationLD(siteUrl: string) {
  const base = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}#organization`,
    name: "By Imperio Dog",
    alternateName: "Imperio Dog",
    description: "Criatorio especializado em Spitz Alemao Anao com suporte dedicado para tutores.",
    url: `${base}/`,
    logo: `${base}/byimperiologo.png`,
    image: `${base}/spitz-hero-desktop.webp`,
    telephone: BRAND.contact.phone,
    publishingPrinciples: `${base}/politica-editorial`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: BRAND.contact.phone,
        contactType: "customer service",
        areaServed: "BR",
        availableLanguage: ["pt-BR"],
      },
    ],
    sameAs: [
      "https://instagram.com/byimperiodog",
      "https://www.youtube.com/@byimperiodog",
      "https://www.tiktok.com/@byimperiodog",
      "https://www.facebook.com/byimperiodog"
    ],
    foundingDate: "2023-01-01",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BR",
      addressRegion: "SP",
      addressLocality: "Sao Paulo",
      postalCode: "01000-000",
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
    alternateName: "Imperio Dog",
    description: "Site da By Imperio Dog com conteudos e filhotes de Spitz Alemao Anao.",
    url: `${clean}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${clean}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

// (Opcional) util para decidir se deve carregar trackers antes de consentimento.
export function shouldLoadImmediate(ids: TrackingIDs) {
  const hasImmediateScript = [
    ids.gtm,
    ids.ga4,
    ids.fb,
    ids.tiktok,
    ids.pinterest,
    ids.hotjar,
    ids.clarity,
  ].some(Boolean);

  const hasHeadCustom = ids.custom.some((pixel) => pixel.enabled && pixel.slot === "head");
  return hasImmediateScript || hasHeadCustom;
}

/** SiteNavigationElement: ajuda o Google a entender os principais links do site. */
export function buildSiteNavigationLD(siteUrl: string) {
  const base = siteUrl.replace(/\/$/, "");
  const items = [
    { name: "Inicio", path: "/" },
    { name: "Filhotes", path: "/filhotes" },
    { name: "Processo", path: "/sobre" },
    { name: "Blog", path: "/blog" },
    { name: "FAQ do tutor", path: "/faq-do-tutor" },
    { name: "Contato", path: "/contato" },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: items.map((i) => i.name),
    url: items.map((i) => `${base}${i.path}`),
  };
}

/** LocalBusiness: reforca presenca local e area de atuacao. */
export function buildLocalBusinessLD(siteUrl: string) {
  const base = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${base}#localbusiness`,
    name: "By Imperio Dog",
    url: `${base}/`,
    image: `${base}/spitz-hero-desktop.webp`,
    logo: `${base}/byimperiologo.png`,
    telephone: BRAND.contact.phone,
    email: "contato@byimperiodog.com.br",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Braganca Paulista",
      addressLocality: "Braganca Paulista",
      addressRegion: "SP",
      postalCode: "12900-000",
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "-22.952258",
      longitude: "-46.541658",
    },
    areaServed: [
      // Estados principais
      { "@type": "State", "name": "São Paulo", "alternateName": "SP" },
      { "@type": "State", "name": "Rio de Janeiro", "alternateName": "RJ" },
      { "@type": "State", "name": "Minas Gerais", "alternateName": "MG" },
      { "@type": "State", "name": "Paraná", "alternateName": "PR" },
      // Capitais e grandes cidades SP
      { "@type": "City", "name": "São Paulo", "containedIn": { "@type": "State", "name": "São Paulo" } },
      { "@type": "City", "name": "Campinas", "containedIn": { "@type": "State", "name": "São Paulo" } },
      { "@type": "City", "name": "São José dos Campos", "containedIn": { "@type": "State", "name": "São Paulo" } },
      { "@type": "City", "name": "Sorocaba", "containedIn": { "@type": "State", "name": "São Paulo" } },
      { "@type": "City", "name": "Ribeirão Preto", "containedIn": { "@type": "State", "name": "São Paulo" } },
      { "@type": "City", "name": "Santos", "containedIn": { "@type": "State", "name": "São Paulo" } },
      // RJ
      { "@type": "City", "name": "Rio de Janeiro", "containedIn": { "@type": "State", "name": "Rio de Janeiro" } },
      { "@type": "City", "name": "Niterói", "containedIn": { "@type": "State", "name": "Rio de Janeiro" } },
      { "@type": "City", "name": "Petrópolis", "containedIn": { "@type": "State", "name": "Rio de Janeiro" } },
      // MG
      { "@type": "City", "name": "Belo Horizonte", "containedIn": { "@type": "State", "name": "Minas Gerais" } },
      { "@type": "City", "name": "Uberlândia", "containedIn": { "@type": "State", "name": "Minas Gerais" } },
      { "@type": "City", "name": "Juiz de Fora", "containedIn": { "@type": "State", "name": "Minas Gerais" } },
      // Nacional
      { "@type": "Country", "name": "Brasil" },
    ],
    priceRange: "$$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "19:00",
      },
    ],
    sameAs: [
      "https://instagram.com/byimperiodog",
      "https://www.youtube.com/@byimperiodog",
      "https://www.tiktok.com/@byimperiodog",
      "https://www.facebook.com/byimperiodog",
    ],
  };
}
