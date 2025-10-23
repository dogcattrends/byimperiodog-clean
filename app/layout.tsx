import type { Metadata } from "next";
import NextDynamic from "next/dynamic";
import { headers } from "next/headers";
import Script from "next/script";
import { Fragment } from "react";

import "./globals.css";
import "../design-system/tokens.css";

// Components
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import SkipLink from "@/components/common/SkipLink";
import ConsentBanner from "@/components/ConsentBanner";
import ToastContainer from "@/components/Toast";
import TrackingScripts from "@/components/TrackingScripts";

import { getSiteSettings } from "@/lib/getSettings";
import { resolveRobots, baseMetaOverrides } from "@/lib/seo";
import { baseSiteMetadata } from "@/lib/seo.core";
import { resolveTracking, buildOrganizationLD, buildWebsiteLD, type CustomPixelConfig } from "@/lib/tracking";

import { ThemeProvider } from "../design-system/theme-provider";
import { dmSans, inter } from "./fonts";

// Deferir carregamento de componentes nÃ£o-crÃ­ticos para reduzir JS inicial
const FloatingPuppiesCTA = NextDynamic(() => import("@/components/FloatingPuppiesCTA"), { ssr: false });

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
  let FB_ID: string | undefined;
  let TT_ID: string | undefined;
  let PIN_ID: string | undefined;
  let HOTJAR_ID: string | undefined;
  let CLARITY_ID: string | undefined;
  let META_VERIFY: string | undefined;
  let organizationLd: Record<string, unknown> | null = null;
  let websiteLd: Record<string, unknown> | null = null;
  let customPixels: CustomPixelConfig[] = [];
  let useGTM = false;

  if (!isAdminRoute) {
    const settings = await getSiteSettings();
    const ids = resolveTracking(settings);
    GTM_ID = ids.gtm;
    GA4_ID = ids.ga4;
    FB_ID = ids.fb;
    TT_ID = ids.tiktok;
    PIN_ID = ids.pinterest;
    HOTJAR_ID = ids.hotjar;
    CLARITY_ID = ids.clarity;
    META_VERIFY = ids.metaVerify;
    customPixels = ids.custom;
    useGTM = Boolean(GTM_ID);

    if (ids.siteUrl) {
      organizationLd = buildOrganizationLD(ids.siteUrl);
      websiteLd = buildWebsiteLD(ids.siteUrl);
    }
  }

  return (
    <html lang="pt-BR" className={`scroll-smooth ${dmSans.variable} ${inter.variable}`}>
      <head>
  {/* ================================================================ */}
  {/* PERFORMANCE: Resource hints essenciais (sem preconnect de fonts porque usamos next/font) */}
  {/* ================================================================ */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link
          rel="preload"
          as="image"
          href="/spitz-hero-desktop.webp"
          type="image/webp"
          fetchPriority="high"
        />
        
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

        {/* GTM (preferencial) */}
        {!isAdminRoute && useGTM && GTM_ID && (
          <Script id="gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
          `}</Script>
        )}

        {/* GA4 direto (somente se Nï¿½O usar GTM) */}
        {!isAdminRoute && !useGTM && GA4_ID && (
          <>
            <Script id="ga4-src" src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} window.gtag = gtag;
              gtag('js', new Date()); gtag('config', '${GA4_ID}', { send_page_view: true });
            `}</Script>
          </>
        )}

        {/* Meta Pixel */}
        {!isAdminRoute && FB_ID && (
          <Script id="fb-pixel" strategy="afterInteractive">{`
            !(function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
            s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${FB_ID}'); fbq('track','PageView');
          `}</Script>
        )}

        {/* TikTok Pixel */}
        {!isAdminRoute && TT_ID && (
          <Script id="tiktok" strategy="afterInteractive">{`
            !function (w, d, t) {w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
            ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],
            ttq.setAndDefer = function(t, e) { t[e] = function() { t.push([e].concat(Array.prototype.slice.call(arguments,0))) } };
            for (var i=0; i<ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
            ttq.instance = function(t) { var e = ttq._i[t] || []; for (var i=0; i<ttq.methods.length; i++) ttq.setAndDefer(e, ttq.methods[i]); return e };
            ttq.load = function(e, n) { var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
            ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i; ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
            var o = d.createElement("script"); o.type = "text/javascript"; o.async = !0; o.src = i + "?sdkid=" + e + "&lib=" + t;
            var a = d.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a); };
            ttq.load('${TT_ID}'); ttq.page(); }(window, document, 'ttq');
          `}</Script>
        )}

        {/* Pinterest Tag */}
        {!isAdminRoute && PIN_ID && (
          <Script id="pinterest" strategy="afterInteractive">{`
            !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};
            var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");
            t.async=!0;t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}
            ("https://s.pinimg.com/ct/core.js"); pintrk('load', '${PIN_ID}'); pintrk('page');
          `}</Script>
        )}

        {/* Hotjar */}
        {!isAdminRoute && HOTJAR_ID && (
          <Script id="hotjar" strategy="afterInteractive">{`
            (function(h,o,t,j,a,r){ h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${Number(HOTJAR_ID)},hjsv:6}; a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1; r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv; a.appendChild(r); })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}</Script>
        )}

        {/* Microsoft Clarity */}
        {!isAdminRoute && CLARITY_ID && (
          <Script id="clarity" strategy="afterInteractive">{`
            (function(c,l,a,r,i,t,y){ c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i; y=l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t,y); })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}</Script>
        )}

        {!isAdminRoute &&
          customPixels
            .filter((pixel) => pixel.enabled && pixel.slot === 'head')
            .map((pixel) => (
              <script key={`custom-head-${pixel.id}`} dangerouslySetInnerHTML={{ __html: pixel.code }} />
            ))}
      </head>

      <body
        className={`min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased ${
          isAdminRoute ? "admin-shell" : ""
        }`}
      >
        {!isAdminRoute && <SkipLink />}
        {/* GTM noscript - recomendado logo apï¿½s <body> */}
        {!isAdminRoute && useGTM && GTM_ID && (
          <noscript
            dangerouslySetInnerHTML={{ __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>` }}
          />
        )}

        {/* Dispara page_view em navegaï¿½ï¿½es SPA */}
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
		{!isAdminRoute &&
			customPixels
				.filter((pixel) => pixel.enabled && pixel.slot === 'body')
				.map((pixel) => (
					<Fragment key={`custom-body-${pixel.id}`}>
						<script dangerouslySetInnerHTML={{ __html: pixel.code }} />
						{pixel.noscript ? (
							<noscript dangerouslySetInnerHTML={{ __html: pixel.noscript }} />
						) : null}
					</Fragment>
				))}

		<ToastContainer />
		</body>
    </html>
  );
}


