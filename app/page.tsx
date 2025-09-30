// app/page.tsx (refatorado premium)
import "server-only";
// Componentes estruturais / seções
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HeroParallaxClient from "@/components/HeroParallaxClient";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";
import PuppiesGrid from "@/components/PuppiesGrid";
// Infra
import { RecentPostsSectionSuspense } from "@/components/home/RecentPostsSection";

export const revalidate = 60; // ISR 60s

export default async function HomePage() {
  return (
    <main id="conteudo-principal" className="relative flex flex-col">
      <Navbar />
      {/* Parallax & Hero (H1 interno no componente Hero) */}
      <HeroParallaxClient />
      <div className="parallax-root" id="hero-parallax">
        <Hero />
      </div>
      {/* Grade dinâmica de filhotes */}
      <PuppiesGrid />
      <RecentPostsSectionSuspense />
  <Testimonials />
      <Footer />
  {/* JSON-LD básico para WebSite */}
      <script
        type="application/ld+json"
        // SEO: Estrutura mínima agregada; lista de posts recent será injetada via seção client (opcional) se necessário.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
    name: 'By Império Dog',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br',
            potentialAction: {
              '@type': 'SearchAction',
  target: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br'}/blog?q={search_term_string}`,
              'query-input': 'required name=search_term_string'
            }
          })
        }}
      />
    </main>
  );
}
