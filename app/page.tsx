import "server-only";

import { BookOpen, ClipboardList, Dog, Handshake, MessageCircle, Search, Info, CalendarCheck, Users, FileText, ExternalLink, PawPrint, ShieldCheck, Tag } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

import FAQBlock from "@/components/answer/FAQBlock";
import PuppiesCatalogGrid from "@/components/catalog/PuppiesCatalogGrid";
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

const Testimonials = dynamic(() => import("@/components/Testimonials"), {
  ssr: false,
  loading: () => null,
});

const GuiaDoTutorCTA = dynamic(() => import("@/components/GuiaDoTutorCTA"), { ssr: false });
const EditorialWhatsAppCTA = dynamic(() => import("./components/EditorialWhatsAppCTA"), { ssr: false });

export const revalidate = 60;

export const metadata = baseSiteMetadata({
  title: "Spitz Alemão Anão (Lulu da Pomerânia) | By Império Dog",
  description:
    "Estrutura familiar e responsável para Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista, com planejamento de ninhadas, orientação de rotina e suporte ao tutor.",
  openGraph: {
    title: "By Império Dog | Spitz Alemão Anão (Lulu da Pomerânia)",
    description:
      "Estrutura especializada com poucas ninhadas ao ano, transparência, entrega humanizada e orientação contínua.",
  },
});

const HOME_SNIPPET =
  "By Império Dog é um portal brasileiro sobre Spitz Alemão Anão (Lulu da Pomerânia) que centraliza catálogo de filhotes, guias e informações essenciais para tutores. Use esta página para entender o processo, comparar opções e seguir para os detalhes certos.";

const HOME_PATHS = [
  { label: "Ver filhotes", href: "/filhotes", icon: PawPrint },
  { label: "Lulu da Pomerania", href: "/lulu-da-pomerania", icon: Dog },
  { label: "Como comprar", href: "/comprar-spitz-anao", icon: Handshake },
  { label: "Faixas de pre‡o", href: "/preco-spitz-anao", icon: FileText },
  { label: "Criador confi vel", href: "/criador-spitz-confiavel", icon: Search },
  { label: "Contato oficial", href: "/contato", icon: MessageCircle },
  { label: "Guia do tutor", href: "/blog", icon: BookOpen },
];

const HOME_FAQ = [
  {
    question: "Como funciona o planejamento de ninhadas?",
    answer: "Informamos a previsão de nascimentos, prioridade de escolha e etapas de conversa antes da reserva.",
  },
  {
    question: "Que tipo de suporte o tutor recebe?",
    answer: "Orientações de rotina, adaptação, socialização e acompanhamento para dúvidas pós-entrega.",
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
         {/* Bloco editorial: autor, data, imagem e headline */}
         <div className="container mx-auto px-4 pt-6 sm:px-6 lg:px-8">
           <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-zinc-500 mb-2">
             <span>Por <span className="font-semibold text-zinc-700">Equipe By Império Dog</span></span>
             <span className="hidden sm:inline">•</span>
             <span>Atualizado em 13 jan 2026</span>
           </div>
           <div className="rounded-3xl overflow-hidden shadow-md border border-[var(--border)] bg-gradient-to-br from-yellow-50 to-white flex flex-col md:flex-row items-center gap-6 p-6 md:p-10 mb-8">
            <img src="/spitz-alemao-home-hero.png" alt="Spitz Alemão Anão (Lulu da Pomerânia) feliz no colo de uma família" className="w-full max-w-md rounded-2xl shadow-md border border-yellow-100 object-cover" width={480} height={480} loading="eager" />
             <div className="flex-1">
              <h1 className="text-xl md:text-3xl font-extrabold text-zinc-900 mb-3 leading-tight">Spitz Alemão Anão: escolha consciente e suporte real</h1>
              <span className="sr-only">Spitz Alemão Anão (Lulu da Pomerânia)</span>
               <p className="text-zinc-700 text-base md:text-lg mb-4">Descubra como funciona o processo, compare perfis de filhotes, tire dúvidas e acesse guias práticos para tutores. Conte com transparência, orientação e acompanhamento em cada etapa.</p>
               <EditorialWhatsAppCTA />
             </div>
           </div>
         </div>

         <section id="resumo" className="container mx-auto px-4 pt-10 sm:px-6 lg:px-8">
           <div data-geo-answer="home" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900">Bem-vindo ao universo do Spitz Alemão Anão (Lulu da Pomerânia)</h2>
             <p className="mt-3 text-sm text-zinc-600">{HOME_SNIPPET}</p>
             <ul className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-600">
               {HOME_PATHS.map((item) => (
                 <li key={item.href}>
                   <Link
                     className="inline-flex items-center gap-2 text-emerald-700 underline decoration-dotted underline-offset-4 transition hover:text-emerald-800"
                     href={item.href}
                   >
                     <item.icon className="h-4 w-4 text-emerald-600" aria-hidden />
                     {item.label}
                   </Link>
                 </li>
               ))}
             </ul>
           </div>
           <div className="mt-8">
             <GuiaDoTutorCTA />
           </div>
         </section>

      <section id="confianca" className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <TrustBlock
          title="Confiança construída com processo claro"
          description="Acompanhamento desde a escolha até a adaptação, com entrega humanizada e orientação contínua."
          items={TRUST_BLOCK_ITEMS}
        />
      </section>

      <section id="catalogo" className="container mx-auto px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-zinc-900">Filhotes em destaque</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Veja os perfis atuais, compare sexo e temperamento e siga para o passo a passo quando fizer sentido.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link className="inline-flex items-center gap-2 underline decoration-dotted" href="/filhotes">
              <PawPrint className="w-4 h-4 text-emerald-700" aria-hidden />
              Ver todos os filhotes
            </Link>
            <Link className="inline-flex items-center gap-2 underline decoration-dotted" href="/comprar-spitz-anao">
              <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden />
              Como comprar com segurança
            </Link>
            <Link className="inline-flex items-center gap-2 underline decoration-dotted" href="/preco-spitz-anao">
              <Tag className="w-4 h-4 text-emerald-700" aria-hidden />
              Entender faixas de preço
            </Link>
          </div>
        </div>
      </section>

      <PuppiesCatalogGrid items={initialPuppies} />

      <section id="guias" className="container mx-auto px-4 pt-14 sm:px-6 lg:px-8">
           <div className="mb-6">
             <div className="flex items-center gap-2 mb-1">
               <BookOpen className="w-6 h-6 text-emerald-700" aria-hidden />
               <h2 className="text-base md:text-xl font-semibold text-zinc-900 truncate max-w-xs md:max-w-full">Guias práticos para tutores</h2>
             </div>
             <p className="mt-2 text-sm text-zinc-600">
               Leituras curtas para apoiar a escolha, com dicas de rotina, saúde e cuidados. Volte sempre que houver novidades.
             </p>
             <Link className="mt-3 inline-flex items-center gap-2 text-sm underline decoration-dotted" href="/blog">
               <FileText className="w-4 h-4 text-emerald-700" aria-hidden />
               Ver todos os artigos
             </Link>
           </div>
        <RecentPostsSectionSuspense />
      </section>

         <Testimonials />

      <section id="processo" className="container mx-auto px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-emerald-700" aria-hidden />
              <h2 className="text-xl font-semibold text-zinc-900">Como funciona na prática</h2>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-emerald-700" aria-hidden />
                <h3 className="text-sm font-semibold text-zinc-900">Definição rápida</h3>
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                Processo guiado com conversa inicial, documentação clara e orientação para rotina e adaptação.
              </p>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-emerald-700" aria-hidden />
                <h3 className="text-sm font-semibold text-zinc-900">Pontos principais</h3>
              </div>
              <ul className="mt-2 space-y-2 pl-0 text-sm text-zinc-600">
                <li className="flex items-start gap-2"><CalendarCheck className="w-4 h-4 mt-0.5 text-emerald-700" aria-hidden /> Planejamento de ninhadas comunicado com antecedência.</li>
                <li className="flex items-start gap-2"><Info className="w-4 h-4 mt-0.5 text-emerald-700" aria-hidden /> Orientações sobre socialização, saúde preventiva e rotina inicial.</li>
                <li className="flex items-start gap-2"><FileText className="w-4 h-4 mt-0.5 text-emerald-700" aria-hidden /> Transparência em documentos e acompanhamento pós-entrega.</li>
              </ul>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList className="w-4 h-4 text-emerald-700" aria-hidden />
                <h3 className="text-sm font-semibold text-zinc-900">Tabela comparativa</h3>
              </div>
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
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-emerald-700" aria-hidden />
                <h3 className="text-sm font-semibold text-zinc-900">Fontes</h3>
              </div>
              <ul className="mt-2 space-y-1 pl-5 text-sm text-zinc-600">
                <li>
                  <a className="inline-flex items-center gap-1 underline decoration-dotted" href="https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html" target="_blank" rel="noreferrer">
                    FCI - German Spitz <ExternalLink className="w-3 h-3 text-emerald-700" aria-hidden />
                  </a>
                </li>
                <li>
                  <a className="inline-flex items-center gap-1 underline decoration-dotted" href="https://www.akc.org/dog-breeds/pomeranian/" target="_blank" rel="noreferrer">
                    AKC - Pomeranian breed overview <ExternalLink className="w-3 h-3 text-emerald-700" aria-hidden />
                  </a>
                </li>
                <li>
                  <a className="inline-flex items-center gap-1 underline decoration-dotted" href="https://wsava.org/global-guidelines/global-nutrition-guidelines/" target="_blank" rel="noreferrer">
                    WSAVA - Global Nutrition Guidelines <ExternalLink className="w-3 h-3 text-emerald-700" aria-hidden />
                  </a>
                </li>
              </ul>
            </div>
          </section>

             <div className="container mx-auto px-4 pt-10 sm:px-6 lg:px-8">
               <div className="flex items-center gap-2 mb-1">
                 <MessageCircle className="w-6 h-6 text-emerald-700" aria-hidden />
                 <h2 className="text-2xl font-semibold text-zinc-900">Perguntas frequentes</h2>
               </div>
               <FAQBlock items={HOME_FAQ} />
             </div>
             {/* Bloco editorial: filtro de perfil com refinamento máximo UI/UX - tela cheia desktop, conteúdo centralizado */}
             <section className="mt-4 rounded-3xl border border-[var(--border)] bg-zinc-50 p-4 sm:p-8 shadow-md max-w-3xl mx-auto">
               <div className="max-w-3xl mx-auto">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="inline-block rounded-full bg-yellow-400/80 px-3 py-1 text-xs font-bold text-zinc-900 tracking-wide">Importante</span>
                   <span className="text-lg" aria-label="Atenção">⚠️</span>
                 </div>
                 <h2 className="text-2xl font-bold text-zinc-900 mb-2">Este perfil é para você?</h2>
                 <p className="text-sm text-zinc-700 mb-6">Antes de avançar, veja se você se identifica com estes pontos essenciais para garantir o bem-estar do filhote e da sua família.</p>
                 <ul className="space-y-5">
                   <li className="flex items-start gap-3 border-l-4 border-yellow-400 pl-3 hover:bg-yellow-50 transition group">
                     <span className="text-xl mt-1" aria-label="Custo real">💰</span>
                     <div>
                      <span className="font-semibold text-zinc-800 underline decoration-yellow-400 group-hover:decoration-2">Custo real:</span> O Spitz Alemão Anão (Lulu da Pomerânia) exige investimento contínuo em alimentação de qualidade, cuidados veterinários, higiene e acessórios. O valor inicial é apenas o começo: mantenha uma reserva mensal para emergências e bem-estar.
                       <span className="block text-xs text-zinc-500 mt-1">Exemplo: consultas e vacinas podem somar mais de R$ 200/mês.</span>
                     </div>
                   </li>
                   <li className="flex items-start gap-3 border-l-4 border-yellow-400 pl-3 hover:bg-yellow-50 transition group">
                     <span className="text-xl mt-1" aria-label="Rotina">⏰</span>
                     <div>
                       <span className="font-semibold text-zinc-800 underline decoration-yellow-400 group-hover:decoration-2">Rotina:</span> Filhotes precisam de tempo dedicado para socialização, brincadeiras e adaptação. Mudanças na rotina familiar podem impactar diretamente o comportamento e a saúde do cão.
                       <span className="block text-xs text-zinc-500 mt-1">Exemplo: ausência prolongada pode gerar ansiedade e problemas de comportamento.</span>
                     </div>
                   </li>
                   <li className="flex items-start gap-3 border-l-4 border-yellow-400 pl-3 hover:bg-yellow-50 transition group">
                     <span className="text-xl mt-1" aria-label="Responsabilidade">🛡️</span>
                     <div>
                       <span className="font-semibold text-zinc-800 underline decoration-yellow-400 group-hover:decoration-2">Responsabilidade:</span> Receber um filhote é assumir compromisso de longo prazo. O tutor ideal se antecipa às necessidades do animal, busca orientação e não terceiriza decisões importantes.
                       <span className="block text-xs text-zinc-500 mt-1">Dica: pesquise sobre a raça e converse com outros tutores antes de decidir.</span>
                     </div>
                   </li>
                   <li className="flex items-start gap-3 border-l-4 border-yellow-400 pl-3 hover:bg-yellow-50 transition group">
                     <span className="text-xl mt-1" aria-label="Perfil ideal">🤝</span>
                     <div>
                      <span className="font-semibold text-zinc-800 underline decoration-yellow-400 group-hover:decoration-2">Perfil ideal:</span> O Spitz Alemão Anão (Lulu da Pomerânia) se adapta melhor a tutores presentes, pacientes e dispostos a aprender. Se você valoriza companhia, rotina estruturada e está aberto a orientações, este perfil é para você.
                       <span className="block text-xs text-zinc-500 mt-1">Alerta: perfis muito ausentes ou com rotina imprevisível tendem a não se adaptar bem.</span>
                     </div>
                   </li>
                 </ul>
                 {/* Client Component para CTA WhatsApp editorial */}
                 {typeof window !== "undefined" ? (
                   <EditorialWhatsAppCTA />
                 ) : null}
               </div>
             </section>
        </div>
      </section>

      {/* WebSite JSON-LD já está em layout.tsx */}
    </main>
  );
}
