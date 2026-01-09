// app/page.tsx
import "server-only";

import dynamic from "next/dynamic";

import FAQBlock from "@/components/answer/FAQBlock";
import PuppiesCatalogGrid from "@/components/catalog/PuppiesCatalogGrid";
import HeroSection from "@/components/sections/Hero";
import TrustBlock from "@/components/ui/TrustBlock";
import type { Puppy } from "@/domain/puppy";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { baseSiteMetadata } from "@/lib/seo.core";
import { supabasePublic } from "@/lib/supabasePublic";
import { TRUST_BLOCK_ITEMS } from "@/lib/trust-data";

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

export const metadata = baseSiteMetadata({
  title: "Spitz Alemão Anão (Lulu da Pomerânia) | By Império Dog",
  description:
    "Criação familiar e responsável de Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista, com planejamento de ninhadas, orientação de rotina e suporte ao tutor.",
  openGraph: {
    title: "By Império Dog | Spitz Alemão Anão (Lulu da Pomerânia)",
    description:
      "Criação especializada com poucas ninhadas ao ano, transparência e suporte direto com a criadora.",
  },
});

const HOME_SNIPPET =
  "By Império Dog é um portal brasileiro sobre Spitz Alemão Anão (Lulu da Pomerânia) que centraliza catálogo de filhotes, guias e informações essenciais para tutores. Aqui você encontra critérios de escolha, orientações de rotina e contato oficial para seguir com o processo.";

const HOME_FAQ = [
  {
    question: "Como funciona o planejamento de ninhadas?",
    answer: "Informamos a previsão de nascimentos, prioridade de escolha e etapas de entrevista antes da reserva.",
  },
  {
    question: "Que tipo de suporte o tutor recebe?",
    answer: "Orientações de rotina, adaptação, socialização e contato direto para dúvidas no pós-entrega.",
  },
  {
    question: "Vocês atendem famílias de outras cidades?",
    answer: "Sim. Organizamos entrega humanizada com planejamento logístico e comunicação clara.",
  },
];

type SupabaseCatalogClient = ReturnType<typeof supabasePublic>;

async function queryPuppiesFromSupabase(client: SupabaseCatalogClient) {
  return client
    .from("puppies")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);
}

async function fetchHomePuppies() {
  try {
    const client = supabasePublic();
    const { data, error } = await queryPuppiesFromSupabase(client);

    if (error) {
      console.error("[HOME] Erro ao buscar filhotes:", error);
      return [];
    }
    const normalized: Puppy[] = (data ?? []).map((row: unknown) => normalizePuppyFromDB(row));
    return normalized.filter((p: Puppy) => p.status === "available" || p.status === "reserved");
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

      <section className="container mx-auto px-4 pt-10 sm:px-6 lg:px-8">
        <div data-geo-answer="home" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Pílula da resposta</h2>
          <p className="mt-3 text-sm text-zinc-600">{HOME_SNIPPET}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <TrustBlock
          title="Confiança comprovada"
          description="Processo guiado com provas sociais, logística premium e suporte direto com a criadora."
          items={TRUST_BLOCK_ITEMS}
        />
      </section>

      {/* Catálogo de Filhotes */}
      <PuppiesCatalogGrid items={initialPuppies} />
      <RecentPostsSectionSuspense />
      <Testimonials />
      <section className="container mx-auto px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900">Sobre Nós</h2>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-zinc-900">Definição rápida</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Esta criação familiar é especializada em Spitz Alemão Anão (Lulu da Pomerânia), com acompanhamento de rotina e suporte contínuo ao tutor.
              </p>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-zinc-900">Pontos principais</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
                <li>O planejamento de ninhadas e comunicado com antecedência.</li>
                <li>A orientação cobre socialização, saúde preventiva e rotina inicial.</li>
                <li>A transparência inclui processos claros e acompanhamento pós-entrega.</li>
              </ul>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-zinc-900">Tabela comparativa</h3>
              <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--border)]">
                <table className="w-full text-left text-sm text-zinc-600">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Etapa</th>
                      <th className="px-4 py-3">O que o tutor recebe</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[var(--border)]">
                      <td className="px-4 py-3 font-medium text-zinc-900">Planejamento</td>
                      <td className="px-4 py-3">Previsão de ninhadas e critérios de prioridade.</td>
                    </tr>
                    <tr className="border-t border-[var(--border)]">
                      <td className="px-4 py-3 font-medium text-zinc-900">Entrega</td>
                      <td className="px-4 py-3">Orientação de chegada, rotina e adaptação inicial.</td>
                    </tr>
                    <tr className="border-t border-[var(--border)]">
                      <td className="px-4 py-3 font-medium text-zinc-900">Suporte</td>
                      <td className="px-4 py-3">Acompanhamento contínuo para dúvidas do tutor.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-zinc-900">Fontes</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
                <li>
                  <a className="underline decoration-dotted" href="https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html" target="_blank" rel="noreferrer">
                    FCI - German Spitz
                  </a>
                </li>
                <li>
                  <a className="underline decoration-dotted" href="https://www.akc.org/dog-breeds/pomeranian/" target="_blank" rel="noreferrer">
                    AKC - Pomeranian breed overview
                  </a>
                </li>
                <li>
                  <a className="underline decoration-dotted" href="https://wsava.org/global-guidelines/global-nutrition-guidelines/" target="_blank" rel="noreferrer">
                    WSAVA - Global Nutrition Guidelines
                  </a>
                </li>
              </ul>
            </div>
          </section>

          <FAQBlock items={HOME_FAQ} />
        </div>
      </section>

      {/* WebSite JSON-LD já está em layout.tsx (buildWebsiteLD) - evita duplicação */}
    </main>
  );
}
