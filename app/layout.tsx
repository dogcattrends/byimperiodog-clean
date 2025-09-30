import type { Metadata } from "next";
import { baseSiteMetadata } from '@/lib/seo.core';
import Script from "next/script";
import "./globals.css";
import '../design-system/tokens.css';
import { ThemeProvider } from '../design-system/theme-provider';
import TrackingScripts from "@/components/TrackingScripts";
import { getSiteSettings } from "@/lib/getSettings";
import ToastContainer from "@/components/Toast";

export const metadata: Metadata = baseSiteMetadata();

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#052e2b",
};

export const revalidate = 60;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Lê do DB e faz fallback para .env
  const s = await getSiteSettings();
  const GTM_ID = (s.gtm_id ?? process.env.NEXT_PUBLIC_GTM_ID ?? "").trim();
  const GA4_ID = (s.ga4_id ?? process.env.NEXT_PUBLIC_GA4_ID ?? "").trim();
  const FB_ID = (s.meta_pixel_id ?? process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "").trim();
  const TT_ID = (s.tiktok_pixel_id ?? process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? "").trim();
  const PIN_ID = (s.pinterest_tag_id ?? process.env.NEXT_PUBLIC_PINTEREST_TAG_ID ?? "").trim();
  const HOTJAR_ID = (s.hotjar_id ?? process.env.NEXT_PUBLIC_HOTJAR_ID ?? "").trim();
  const CLARITY_ID = (s.clarity_id ?? process.env.NEXT_PUBLIC_CLARITY_ID ?? "").trim();
  const META_VERIFY = (s.meta_domain_verify ?? process.env.NEXT_PUBLIC_META_DOMAIN_VERIFY ?? "").trim();

  const ORG_LD = {
    "@context": "https://schema.org",
    "@type": "Organization",
  name: "By Imperio Dog",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br/",
  logo: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br") + "/logo.png",
    telephone: "+55 11 98663-3239",
    sameAs: [
      "https://instagram.com/byimperiodog",
      "https://www.youtube.com/@byimperiodog",
      "https://www.tiktok.com/@byimperiodog",
      "https://t.me/byimperiodog",
    ],
  };

  const WEBSITE_LD = {
    "@context": "https://schema.org",
    "@type": "WebSite",
  name: "By Imperio Dog",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br/",
    potentialAction: {
      "@type": "SearchAction",
  target: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br"}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const useGTM = Boolean(GTM_ID);

  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        {/* Verificação de domínio Meta (se houver) */}
        {META_VERIFY && <meta name="facebook-domain-verification" content={META_VERIFY} />}

        {/* Preconnect / DNS Prefetch condicional para analytics: evita custo em páginas sem tags */}
        {useGTM && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
            <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        )}
        {!useGTM && GA4_ID && (
          <>
            <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        )}

        {/* JSON-LD (Organization + WebSite) */}
        <Script id="org-ld" type="application/ld+json" strategy="afterInteractive">{JSON.stringify(ORG_LD)}</Script>
        <Script id="website-ld" type="application/ld+json" strategy="afterInteractive">{JSON.stringify(WEBSITE_LD)}</Script>

        {/* GTM (preferencial) */}
        {useGTM && (
          <Script id="gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
          `}</Script>
        )}

        {/* GA4 direto (somente se NÃO usar GTM) */}
        {!useGTM && GA4_ID && (
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
        {FB_ID && (
          <Script id="fb-pixel" strategy="afterInteractive">{`
            !(function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
            s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${FB_ID}'); fbq('track','PageView');
          `}</Script>
        )}

        {/* TikTok Pixel */}
        {TT_ID && (
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
        {PIN_ID && (
          <Script id="pinterest" strategy="afterInteractive">{`
            !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};
            var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");
            t.async=!0;t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}
            ("https://s.pinimg.com/ct/core.js"); pintrk('load', '${PIN_ID}'); pintrk('page');
          `}</Script>
        )}

        {/* Hotjar */}
        {HOTJAR_ID && (
          <Script id="hotjar" strategy="afterInteractive">{`
            (function(h,o,t,j,a,r){ h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${Number(HOTJAR_ID)},hjsv:6}; a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1; r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv; a.appendChild(r); })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}</Script>
        )}

        {/* Microsoft Clarity */}
        {CLARITY_ID && (
          <Script id="clarity" strategy="afterInteractive">{`
            (function(c,l,a,r,i,t,y){ c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i; y=l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t,y); })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}</Script>
        )}
      </head>

      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        <a href="#conteudo-principal" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 rounded bg-emerald-700 px-4 py-2 text-white text-sm">Pular para o conteúdo</a>
        {/* GTM noscript — recomendado logo após <body> */}
        {useGTM && (
          <noscript
            dangerouslySetInnerHTML={{ __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>` }}
          />
        )}

        {/* Dispara page_view em navegações SPA */}
        <TrackingScripts />

        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1" id="conteudo-principal" tabIndex={-1}>
              {children}
            </div>
            <footer role="contentinfo" className="mt-8 border-t border-emerald-900/10 bg-emerald-50/40 py-8 text-xs text-emerald-900 dark:border-emerald-300/10 dark:bg-emerald-900/30 dark:text-emerald-100">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-4 justify-between">
                <p>&copy; {new Date().getFullYear()} By Imperio Dog</p>
                <nav aria-label="Links institucionais" className="flex gap-4">
                  <a href="/sobre" className="hover:underline">Sobre</a>
                  <a href="/contato" className="hover:underline">Contato</a>
                  <a href="/politica-de-privacidade" className="hover:underline">Privacidade</a>
                </nav>
              </div>
            </footer>
          </div>
        </ThemeProvider>
        <ToastContainer />
      </body>
    </html>
  );
}
