type JsonLd = Record<string, unknown>;

const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br";

export function organizationSchema(siteUrl: string = DEFAULT_SITE_URL): JsonLd {
  const baseUrl = normalizeSiteUrl(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "By Imperio Dog",
    url: baseUrl,
    logo: `${baseUrl}/byimperiologo.svg`,
    sameAs: [
      "https://www.instagram.com/byimperiodog",
      "https://www.youtube.com/@byimperiodog",
      "https://www.facebook.com/byimperiodog",
      "https://www.tiktok.com/@byimperiodog",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+55 11 98663-3239",
        contactType: "customer service",
        availableLanguage: ["pt-BR"],
        areaServed: ["BR"],
      },
    ],
  };
}

export function websiteSchema(siteUrl: string = DEFAULT_SITE_URL): JsonLd {
  const baseUrl = normalizeSiteUrl(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: "By Imperio Dog",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function productSchema(
  siteUrl: string,
  puppy: {
    id: string;
    name: string;
    price_cents?: number | null;
    gender?: string | null;
    color?: string | null;
  }
): JsonLd {
  const baseUrl = normalizeSiteUrl(siteUrl);
  const price =
    typeof puppy.price_cents === "number"
      ? (puppy.price_cents / 100).toFixed(2)
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${baseUrl}/filhotes/${puppy.id}#product`,
    name: puppy.name,
    description:
      "Spitz Alemão (Lulu da Pomerânia) com até 22 cm de altura, acompanhamento vitalício e suporte personalizado.",
    brand: {
      "@type": "Brand",
      name: "By Imperio Dog",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price,
      availability: "https://schema.org/LimitedAvailability",
      url: `${baseUrl}/filhotes`,
    },
    additionalProperty: [
      puppy.gender
        ? { "@type": "PropertyValue", name: "Sexo", value: puppy.gender }
        : null,
      puppy.color
        ? { "@type": "PropertyValue", name: "Cor", value: puppy.color }
        : null,
    ].filter(Boolean),
  };
}

export function faqSchema(
  siteUrl: string,
  faqs: Array<{ question: string; answer: string }>
): JsonLd {
  const baseUrl = normalizeSiteUrl(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${baseUrl}/faq#faq`,
    mainEntity: buildFaqEntities(faqs),
  };
}

export function faqPageSchema(
  faqs: Array<{ question: string; answer: string }>,
  canonicalUrl: string
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: canonicalUrl,
    mainEntity: buildFaqEntities(faqs),
  };
}

export function blogPostingSchema(
  siteUrl: string,
  post: {
    slug: string;
    title: string;
    description: string;
    publishedAt: string;
    modifiedAt?: string | null;
    image?: { url: string; alt?: string | null };
    author?: { name: string; url?: string | null };
    keywords?: string[];
    articleSection?: string | null;
  }
): JsonLd {
  const baseUrl = normalizeSiteUrl(siteUrl);
  const url = `${baseUrl}/blog/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#blogposting`,
    mainEntityOfPage: url,
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt ?? post.publishedAt,
    image: post.image?.url ? [post.image.url] : undefined,
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.name,
          url: post.author.url ?? undefined,
        }
      : {
          "@type": "Organization",
          name: "By Imperio Dog",
        },
    publisher: {
      "@type": "Organization",
      name: "By Imperio Dog",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/byimperiologo.svg`,
      },
    },
    keywords: post.keywords && post.keywords.length > 0 ? post.keywords : undefined,
    articleSection: post.articleSection ?? undefined,
  };
}

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/$/, "");
}

function buildFaqEntities(
  faqs: Array<{ question: string; answer: string }>
) {
  return faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  }));
}
