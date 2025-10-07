// app/page.tsx
import "server-only";

import Hero from "@/components/Hero";
import HeroParallaxClient from "@/components/HeroParallaxClient";
import { RecentPostsSectionSuspense } from "@/components/home/RecentPostsSection";
import PuppiesGrid from "@/components/PuppiesGrid";
import Testimonials from "@/components/Testimonials";

export const revalidate = 60; // ISR interval in seconds

export default async function HomePage() {
  return (
    <main id="conteudo-principal" className="relative flex flex-col">
      {/* Hero and parallax experience */}
      <HeroParallaxClient />
      <div className="parallax-root" id="hero-parallax">
        <Hero />
      </div>

      {/* Puppies listing */}
      <PuppiesGrid />
      <RecentPostsSectionSuspense />
      <Testimonials />

      {/* Basic WebSite structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'By Imperio Dog',
            url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br'),
            potentialAction: {
              '@type': 'SearchAction',
              target: `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br')}/blog?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
    </main>
  );
}
