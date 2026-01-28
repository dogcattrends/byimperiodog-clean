import Script from "next/script";

export function ArticleJsonLd({ ld }: { ld: object }) {
  return (
    <Script
      id="article-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}

export function BreadcrumbJsonLd({ ld }: { ld: object }) {
  return (
    <Script
      id="breadcrumb-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}

export function FAQJsonLd({ ld }: { ld: object }) {
  return (
    <Script
      id="faq-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
