// app/page.tsx
import "server-only";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

import HeroSection from "@/components/sections/Hero";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Lazy load below-the-fold components para reduzir JS inicial e TBT
const PuppiesGridPremium = dynamic(
  () => import("@/components/PuppiesGridPremium"),
  {
    ssr: true,
    loading: () => (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="h-96 rounded-lg bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-100 animate-pulse" />
        </div>
      </section>
    ),
  }
);

const RecentPostsSectionSuspense = dynamic(
  () => import("@/components/home/RecentPostsSection").then((mod) => ({ default: mod.RecentPostsSectionSuspense })),
  { ssr: true }
);

// Deferir componente com framer-motion para reduzir JS inicial
const Testimonials = dynamic(() => import("@/components/Testimonials"), {
  ssr: false,
  loading: () => null,
});

export const revalidate = 60; // ISR interval in seconds

export const metadata: Metadata = {
  title: "Spitz Alemão Anão (Lulu da Pomerânia) | By Império Dog",
  description:
    "Criação familiar e responsável de Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista. Filhotes com pedigree CBKC, laudos e mentoria vitalícia.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "By Império Dog | Spitz Alemão Anão (Lulu da Pomerânia)",
    description:
      "Criação especializada com poucas ninhadas ao ano, transparência e suporte direto com a criadora.",
  },
};

async function fetchHomePuppies() {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("puppies")
      .select("*")
      .in("status", ["disponivel", "reservado"])
      .order("created_at", { ascending: false })
      .limit(12);

    if (error || !data) {
      console.error("[HOME] Erro ao buscar filhotes:", error);
      return [];
    }

    return data.map(normalizePuppyFromDB);
  } catch (err) {
    console.error("[HOME] Exception ao buscar filhotes:", err);
    return [];
  }
}

export default async function HomePage() {
  const initialPuppies = await fetchHomePuppies();
  return (
    <main id="conteudo-principal" role="main" className="relative flex flex-col">
      <HeroSection />

      {/* Catálogo Premium de Filhotes */}
      <PuppiesGridPremium initialItems={initialPuppies} />
      <RecentPostsSectionSuspense />
      <Testimonials />

      {/* WebSite JSON-LD já está em layout.tsx (buildWebsiteLD) - evita duplicação */}
    </main>
  );
}
