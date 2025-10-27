import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import NextDynamic from "next/dynamic";
import { headers } from "next/headers";
import { Fragment } from "react";

import "./globals.css";
import "../design-system/tokens.css";

// Components
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import SkipLink from "@/components/common/SkipLink";
import Pixels from "@/components/Pixels";
import ToastContainer from "@/components/Toast";
import { getSiteSettings } from "@/lib/getSettings";
import { resolveRobots, baseMetaOverrides } from "@/lib/seo";
import { baseSiteMetadata } from "@/lib/seo.core";
import { resolveTracking, buildOrganizationLD, buildWebsiteLD } from "@/lib/tracking";

import { ThemeProvider } from "../design-system/theme-provider";

import { dmSans, inter } from "./fonts";

// Lazy load componentes não-críticos para reduzir TBT
const FloatingPuppiesCTA = NextDynamic(() => import("@/components/FloatingPuppiesCTA"), { ssr: false });
const ConsentBanner = NextDynamic(() => import("@/components/ConsentBanner"), { ssr: false });
const TrackingScripts = NextDynamic(() => import("@/components/TrackingScripts"), { ssr: false });

export const metadata: Metadata = baseSiteMetadata({
  // Garantir template consistente; se jï¿½ definido em baseSiteMetadata mantï¿½m.
  // Robots default (podem ser sobrescritos dinamicamente em headers runtime se necessï¿½rio)
  robots: resolveRobots(),
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#052e2b",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resolvePathname() {
  const reqHeaders = headers();
  const candidates = [
    "x-invoke-path",
    "x-matched-path",
    "x-rewrite-url",
    "x-original-url",
    "x-original-uri",
    "x-forwarded-url",
    "x-forwarded-uri",
    "x-next-url",
    "next-url",
  ];
  for (const key of candidates) {
    const raw = reqHeaders.get(key);
    if (!raw) continue;
    const value = raw.trim();
    if (!value) continue;
    try {
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return new URL(value).pathname;
      }
      if (value.startsWith("/")) return value;
      // Algumas plataformas enviam apenas path + query sem barra inicial.
      if (/^[a-zA-Z0-9\-_.~%]+(\/.+)?$/.test(value)) {
        return `/${value}`;
      }
    } catch {
      // ignore parsing errors and continue to next header
    }
  }
  return "";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = resolvePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  // Ajustes dinï¿½micos de canonical/OG URL (Next nï¿½o reexecuta metadata para cada navegaï¿½ï¿½o SPA, mas em SSR inicial temos path)
  const metaRuntime = baseMetaOverrides(pathname);

  let GTM_ID: string | undefined;
  let GA4_ID: string | undefined;
  let META_VERIFY: string | undefined;
  let organizationLd: Record<string, unknown> | null = null;
  let websiteLd: Record<string, unknown> | null = null;
  let useGTM = false;

  if (!isAdminRoute) {
    const settings = await getSiteSettings();
    const ids = resolveTracking(settings);
    GTM_ID = ids.gtm;
    GA4_ID = ids.ga4;
    META_VERIFY = ids.metaVerify;
    useGTM = Boolean(GTM_ID);

    if (ids.siteUrl) {
      organizationLd = buildOrganizationLD(ids.siteUrl);
      websiteLd = buildWebsiteLD(ids.siteUrl);
    }
  }

  return (
    <html lang="pt-BR" className={`scroll-smooth ${dmSans.variable} ${inter.variable}`}>
      <head>
        <meta charSet="utf-8" />
  {/* ================================================================ */}
  {/* PERFORMANCE: Resource hints essenciais */}
  {/* ================================================================ */}
        <link rel="preconnect" href="https://npmnuihgydadihktglrd.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://analytics.tiktok.com" />
        <link rel="dns-prefetch" href="https://s.pinimg.com" />
        
        {/* Preload Hero LCP image para eliminar waterfall (-200-400ms) */}
        {/* Responsive: mobile WebP, desktop WebP (Next.js Image já gera AVIF automaticamente) */}
        {!isAdminRoute && pathname === "/" && (
          <>
            <link
              rel="preload"
              as="image"
              href="/spitz-hero-desktop.webp"
              type="image/webp"
              fetchPriority="high"
            />
          </>
        )}
        
        {/* Canonical dinï¿½mico (reforï¿½o; alternates via metadata) */}
        {metaRuntime.alternates?.canonical && (
          <link rel="canonical" href={metaRuntime.alternates.canonical as string} />
        )}
        {/* Verificaï¿½ï¿½o de domï¿½nio Meta (se houver) */}
        {!isAdminRoute && META_VERIFY && (
          <meta name="facebook-domain-verification" content={META_VERIFY} />
        )}

        {/* Preconnect / DNS Prefetch condicional para analytics: evita custo em pï¿½ginas sem tags */}
        {!isAdminRoute && useGTM && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
            <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        )}
        {!isAdminRoute && !useGTM && GA4_ID && (
          <>
            <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        )}

        {/* JSON-LD inline para renderizaï¿½ï¿½o imediata (melhor SEO) */}
        {!isAdminRoute && organizationLd && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
          />
        )}
        {!isAdminRoute && websiteLd && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
          />
        )}


        {/** Pixels custom HTML removidos por segurança. Apenas modelos oficiais via <Pixels />. */}
      </head>

      <body
        className={`min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased ${
          isAdminRoute ? "admin-shell" : ""
        }`}
      >
        {!isAdminRoute && <SkipLink />}
        {!isAdminRoute && <Pixels isAdminRoute={isAdminRoute} />}

        {/* Dispara page_view em navegações SPA (só envia quando os pixels existirem) */}
        {!isAdminRoute && <TrackingScripts />}

        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            {!isAdminRoute && <Header />}
            {!isAdminRoute && <div aria-hidden className="h-20" />}
            <div className="flex-1" id="conteudo-principal" tabIndex={-1}>
              {children}
            </div>
            {!isAdminRoute && <Footer />}
            {!isAdminRoute && <FloatingPuppiesCTA disabled={false} />}
            {!isAdminRoute && <ConsentBanner />}
          </div>
        </ThemeProvider>
		<SpeedInsights />
		<ToastContainer />
		</body>
    </html>
  );
}


