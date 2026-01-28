import Script from "next/script";

export function BreadcrumbJsonLd({ ld }: { ld: object }) {
  return (
    <Script
      id="breadcrumb-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}

export function WebPageJsonLd({ ld }: { ld: object }) {
  return (
    <Script
      id="webpage-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
