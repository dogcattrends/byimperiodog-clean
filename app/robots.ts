import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
  
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",                    // Admin routes - confidencial
          "/api/admin/",                // Admin API - confidencial
          "/blog/preview/",             // Blog preview - não publicado
          "/*.json$",                   // JSON files
          "/*?*sort=",                  // Query strings de sorting
          "/*?*filter=",                // Query strings de filtros
        ],
        crawlDelay: 1,                 // Respeitar servidor
      },
      // Especificar AIs/bots se necessário
      {
        userAgent: "GPTBot",
        disallow: "/",                 // Bloquear AI crawlers se desejar
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
    ],
    sitemap: [`${base}/sitemap-index.xml`],
    host: base,
  };
}
