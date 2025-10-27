// app/page.tsx
import "server-only";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

import HeroSection from "@/components/sections/Hero";

// Lazy load below-fold components para reduzir JS inicial e TBT
const PuppiesGrid = dynamic(() => import("@/components/PuppiesGrid"), { 
  ssr: true, 
  loading: () => (
    <section className="py-16">
      <div className="container mx-auto">
        <div className="h-96 animate-pulse bg-gray-100 rounded-lg" />
      </div>
    </section>
  )
});

const RecentPostsSectionSuspense = dynamic(
  () => import("@/components/home/RecentPostsSection").then(mod => ({ default: mod.RecentPostsSectionSuspense })), 
  { ssr: true }
);

// Deferir componente com framer-motion para reduzir JS inicial
const Testimonials = dynamic(() => import("@/components/Testimonials"), { 
  ssr: false, 
  loading: () => null 
});

export const revalidate = 60; // ISR interval in seconds

export const metadata: Metadata = {
  title: "Spitz Alemão Anão Lulu da Pomerânia | By Império Dog",
  description:
    "Criação familiar e responsável de Spitz Alemão Anão Lulu da Pomerânia em Bragança Paulista. Filhotes com pedigree CBKC, laudos e mentoria vitalícia.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "By Império Dog | Spitz Alemão Anão (Lulu da Pomerânia)",
    description:
      "Criação especializada com poucas ninhadas ao ano, transparência e suporte direto com a criadora.",
  },
};

export default async function HomePage() {
  return (
    <main id="conteudo-principal" className="relative flex flex-col">
      <HeroSection />

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
