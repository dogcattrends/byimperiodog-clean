// app/page.tsx
import "server-only";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { RecentPostsSectionSuspense } from "@/components/home/RecentPostsSection";
import PuppiesGrid from "@/components/PuppiesGrid";
import HeroSection from "@/components/sections/Hero";

// Deferir componente com framer-motion para reduzir JS inicial
const Testimonials = dynamic(() => import("@/components/Testimonials"), { ssr: false, loading: () => null });

export const revalidate = 60; // ISR interval in seconds

export const metadata: Metadata = {
  title: "Spitz Alemão Anão Lulu da Pomerânia | By Império Dog",
  description:
    "Criação familiar e responsável de Spitz Alemão Anão Lulu da Pomerânia em Bragança Paulista. Filhotes com pedigree CBKC, laudos e mentoria vitalícia.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "By Império Dog | Spitz Alemão Anão",
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
