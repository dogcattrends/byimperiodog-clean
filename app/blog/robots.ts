import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/,'');
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/blog', '/blog/*'],
        disallow: [
          '/api',
          '/api/*',
          // parâmetros de busca (evitar indexação de variações com querystring)
          '/search?*',
          '/blog?*',
        ],
      },
    ],
    sitemap: [
      `${site}/sitemap-index.xml`, // global index (renomeado para evitar conflito)
      `${site}/blog/sitemap.xml`, // blog-specific
    ],
  };
}
