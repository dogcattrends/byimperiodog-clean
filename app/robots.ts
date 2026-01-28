import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
 const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
 return {
 rules: {
 userAgent: "*",
 allow: "/",
 disallow: ["/admin/", "/blog/preview/", "/api/"],
 },
 sitemap: [`${base}/sitemap-index.xml`, `${base}/sitemap.xml`],
 host: base,
 };
}
