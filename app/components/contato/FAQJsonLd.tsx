import Script from "next/script";

export function FAQJsonLd({ ld }: { ld: object }) {
  return (
    <Script
      id="faq-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
