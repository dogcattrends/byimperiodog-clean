"use client";

import { useEffect } from "react";
import { initWebVitals, logEvent } from "@/lib/analytics";

export default function TrackingScripts() {
  useEffect(() => {
    const sendPageView = () => {
      const url = window.location.href;
      const pathname = window.location.pathname;
      const search = window.location.search ? window.location.search.replace(/^\?/, "") : "";

      // GA4 / Ads (gtag)
      // @ts-ignore
      const gtag = (window as any).gtag;
      if (typeof gtag === "function") {
        gtag("event", "page_view", {
          page_location: url,
          page_path: pathname + (search ? `?${search}` : ""),
        });
      }

      // Meta Pixel
      // @ts-ignore
      const fbq = (window as any).fbq;
      if (typeof fbq === "function") {
        fbq("track", "PageView");
      }

      // TikTok
      // @ts-ignore
      const ttq = (window as any).ttq;
      if (ttq && typeof ttq.page === "function") {
        ttq.page();
      }

      // Pinterest
      // @ts-ignore
      const pintrk = (window as any).pintrk;
      if (typeof pintrk === "function") {
        pintrk("page");
      }
    };

    // Defer tracking para não bloquear main thread
    // RequestIdleCallback para melhor TBT/INP
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        sendPageView();
        initWebVitals();
      }, { timeout: 2000 });
    } else {
      // Fallback para navegadores sem suporte
      setTimeout(() => {
        sendPageView();
        initWebVitals();
      }, 1);
    }

    // Delegated clicks for CTR (cards, toc, share)
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest('[data-evt]') as HTMLElement | null;
      if (!el) return;
      const name = el.getAttribute('data-evt');
      if (!name) return;
      const meta: Record<string, any> = {};
      const id = el.getAttribute('data-id'); if (id) meta.id = id;
      const label = el.getAttribute('aria-label') || el.textContent?.trim()?.slice(0,80) || undefined;
      if (label) meta.label = label;
      if (name === 'card_click' || name === 'toc_click' || name === 'share_click') {
        logEvent(name, meta);
      }
    };
    document.addEventListener('click', onClick, true);

    // listen for SPA navigation
    const onPop = () => sendPageView();
    window.addEventListener("popstate", onPop);
    window.addEventListener("pushstate" as any, onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pushstate" as any, onPop);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  return null;
}
