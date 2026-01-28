import Script from "next/script";

import FAQBlock from "@/components/answer/FAQBlock";
import LeadForm from "@/components/LeadForm";
import PageViewPing from "@/components/PageViewPing";
import TrackedLink from "@/components/ui/TrackedLink";
import { buildArticleLD, buildBreadcrumbLD, buildFAQPageLD } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { whatsappLeadUrl } from "@/lib/utm";

const TITLE = "Comprar Spitz Alemão Anão (Lulu da Pomerânia)";

export const metadata = pageMetadata({
  title: "Comprar Spitz Alemão Anão (Lulu da Pomerânia) | By Império Dog",
  description:
    "Guia completo para comprar Spitz Alemão Anão (Lulu da Pomerânia) com transparência, pedigree e entrega segura. Veja o passo a passo e receba recomendações.",
  path: "/comprar-spitz-anao",
});

const PUBLISHED_AT = "2024-02-01";
const MODIFIED_AT = "2024-12-01";

const COMPRAR_SNIPPET =
  "Este guia pilar explica como comprar um Spitz Alemão Anão (Lulu da Pomerânia) com transparência, documentação, logística combinada e orientação contínua. Use para comparar opções, organizar sua decisão e seguir um passo a passo claro até a reserva.";

const COMPRAR_STEPS = [
  "Defina perfil: sexo/cor/rotina",
  "Receba recomendações com fotos/vídeos atuais",
  "Reserva com contrato + orientações de preparação",
  "Entrega segura com alinhamento de logística",
  "Suporte contínuo para adaptação",
];

const COMPRAR_CHECKLIST = [
  "Documentação: contrato + orientações + histórico do filhote",
  "Transparência: fotos/vídeos atuais + alinhamento de rotina",
  "Suporte: canal aberto no pós-entrega",
  "Logística: prazo e forma de entrega combinados antes",
];

const COMPRAR_FAQ = [
  {
    question: "O filhote vem com pedigree?",
    answer: "Sim. A documentação inclui o pedigree e as orientações entregues junto ao filhote.",
  },
  {
    question: "Como funciona a entrega?",
    answer: "A entrega é organizada com alinhamento prévio de logística e orientações iniciais para a chegada do filhote.",
  },
  {
    question: "Há garantia de saúde?",
    answer: "Existe garantia conforme contrato, com foco em transparência e acompanhamento preventivo.",
  },
  {
    question: "Por que escolher a By Império Dog?",
    answer: "Porque oferecemos processo claro, documentação completa, entrega segura e acompanhamento contínuo na adaptação.",
  },
];

const COMPRAR_SOURCES = [
  { label: "FCI - German Spitz", url: "https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html" },
  { label: "AKC - Pomeranian breed overview", url: "https://www.akc.org/dog-breeds/pomeranian/" },
];

export default function ComprarSpitzPage() {
  const articleLd = buildArticleLD({
    url: "https://www.byimperiodog.com.br/comprar-spitz-anao",
    title: TITLE,
    description:
      "Passo a passo para comprar Spitz Alemão Anão com transparência, documentação e entrega segura.",
    datePublished: PUBLISHED_AT,
    dateModified: MODIFIED_AT,
  });

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: "https://www.byimperiodog.com.br/" },
    { name: "Comprar Spitz Anão", url: "https://www.byimperiodog.com.br/comprar-spitz-anao" },
  ]);

  const faqLd = buildFAQPageLD(COMPRAR_FAQ);

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Como comprar Spitz Alemão Anão (Lulu da Pomerânia)",
    description: "Etapas claras para escolher, reservar e receber um filhote com segurança.",
    step: COMPRAR_STEPS.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step,
      text: step,
    })),
  };

  const DATA_PUBLICACAO = "Publicado em 10 de janeiro de 2024";
  const DATA_ATUALIZACAO = "Atualizado em 13 de janeiro de 2026";
  const AUTOR = "Por By Império Dog";
  return (
    <main className="container mx-auto px-4 py-10 pb-28 lg:pb-10">
      <PageViewPing pageType="intent" intent="comprar-spitz-anao" />

      <figure className="mb-8">
        <img
          src="/og/spitz-alemao.png"
          alt="Filhote de Spitz Alemão Anão (Lulu da Pomerânia)"
          className="w-full rounded-2xl shadow-lg object-cover max-h-[420px] mx-auto"
          style={{ aspectRatio: '2/1', background: '#f3f3f3' }}
        />
        <figcaption className="text-xs text-zinc-500 text-center mt-2">Imagem ilustrativa: Filhote de Spitz Alemão Anão</figcaption>
      </figure>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="text-sm text-zinc-500">{AUTOR}</span>
        <span className="text-sm text-zinc-500">{DATA_PUBLICACAO}</span>
        <span className="text-sm text-zinc-500">{DATA_ATUALIZACAO}</span>
      </div>

      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Comprar Spitz Alemão Anão: O Guia Sincero para Escolher com Segurança</h1>
        <p className="text-lg text-zinc-700">
          Comprar um Spitz Alemão Anão (Lulu da Pomerânia) é uma decisão cheia de detalhes e dúvidas. Este guia editorial desvenda o processo sem promessas fáceis, mostrando o que realmente importa para quem busca um novo companheiro — da escolha do perfil à adaptação em casa, com transparência e dicas que valem para sempre.
        </p>
      </header>

      <nav aria-label="Nesta página" className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold">Nesta página</h2>
        <ul className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <li>
            <a className="underline decoration-dotted" href="#como-comprar">
              Como comprar
            </a>
          </li>
          <li>
            <a className="underline decoration-dotted" href="#checklist">
              Checklist
            </a>
          </li>
          <li>
            <a className="underline decoration-dotted" href="#tabela">
              Tabela
            </a>
          </li>
          <li>
            <a className="underline decoration-dotted" href="#faq">
              FAQ
            </a>
          </li>
          <li>
            <a className="underline decoration-dotted" href="#recomendacoes">
              Recomendações
            </a>
          </li>
          <li>
            <a className="underline decoration-dotted" href="#fontes">
              Fontes
            </a>
          </li>
        </ul>
      </nav>

      <section data-geo-answer="comprar-spitz-anao" className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Visão geral</h2>
        <p className="mt-2 text-sm text-muted-foreground">{COMPRAR_SNIPPET}</p>
      </section>

      <section id="como-comprar" className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Como comprar (passo a passo)</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          {COMPRAR_STEPS.map((step) => (
            <li key={step}>{step}.</li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <TrackedLink className="underline decoration-dotted" href="/filhotes" analyticsPayload={{ from: 'comprar-spitz' }}>
            Ver filhotes disponíveis
          </TrackedLink>
          <TrackedLink className="underline decoration-dotted" href="/preco-spitz-anao" analyticsPayload={{ from: 'comprar-spitz' }}>
            Entender preços e faixas
          </TrackedLink>
          <TrackedLink className="underline decoration-dotted" href="/contato" analyticsPayload={{ from: 'comprar-spitz' }}>
            Contato e atendimento
          </TrackedLink>
        </div>
      </section>

      <section id="checklist" className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Checklist antes da reserva</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {COMPRAR_CHECKLIST.map((item) => (
            <li key={item}>{item}.</li>
          ))}
        </ul>
        <div className="mt-4 grid gap-2">
          <TrackedLink
            href="/reserve-seu-filhote"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold transition hover:bg-surface-subtle"
            analyticsPayload={{ from: 'comprar-spitz' }}
          >
            Ver como funciona a reserva
          </TrackedLink>
          {process.env.NEXT_PUBLIC_WA_PHONE && (
            <TrackedLink
              className="btn-whatsapp inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold"
              target="_blank"
              rel="noreferrer"
              href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), {
                pageType: "intent",
                url: "https://www.byimperiodog.com.br/comprar-spitz-anao",
                intent: "comprar-spitz-anao",
              })}
              aria-label="Atendimento via WhatsApp"
              analyticsEvent="cta_click"
              analyticsPayload={{ placement: 'comprar-spitz', cta: 'whatsapp', context: 'checklist', label: 'Atendimento via WhatsApp' }}
            >
              Atendimento via WhatsApp
            </TrackedLink>
          )}
        </div>
      </section>

      <section id="tabela" className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Tabela comparativa</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-surface-subtle text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Etapa</th>
                <th className="px-4 py-3">O que verificar</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">Documentação</td>
                <td className="px-4 py-3">Pedigree, contrato e histórico de saúde.</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">Entrega</td>
                <td className="px-4 py-3">Planejamento logístico e orientação inicial.</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">Suporte</td>
                <td className="px-4 py-3">Acompanhamento para adaptação e rotina.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="faq" className="mt-6">
        <FAQBlock items={COMPRAR_FAQ} />
      </section>

      <section id="recomendacoes" className="mt-10">
        <h2 className="text-xl font-semibold">Receber recomendações personalizadas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Conte o perfil desejado e o contexto da família. Assim enviamos sugestões atuais com fotos e vídeos.
        </p>
        <LeadForm context={{ pageType: "intent", intent: "comprar-spitz-anao" }} />
        <div className="mt-6 flex justify-center">
          <TrackedLink
            href="/criador-spitz-confiavel"
            analyticsPayload={{ from: 'comprar-spitz-anao' }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-amber-50 px-6 py-3 text-base font-bold text-amber-900 shadow-sm transition hover:bg-amber-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
            style={{ textDecoration: 'none' }}
          >
            <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 text-amber-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
          Clique aqui: Saiba como Identificar um Criador Confiável
          </TrackedLink>
        </div>
      </section>

      <section id="fontes" className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Fontes</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {COMPRAR_SOURCES.map((item) => (
            <li key={item.url}>
              <TrackedLink className="underline decoration-dotted" href={item.url} target="_blank" rel="noreferrer" analyticsPayload={{ from: 'comprar-spitz', label: item.label }}>
                {item.label}
              </TrackedLink>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        {process.env.NEXT_PUBLIC_WA_PHONE && (
          <TrackedLink
            className="btn-whatsapp inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
            target="_blank"
            rel="noreferrer"
            href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), {
              pageType: "intent",
              url: "https://www.byimperiodog.com.br/comprar-spitz-anao",
              intent: "comprar-spitz-anao",
            })}
            aria-label="Atendimento via WhatsApp"
            analyticsEvent="cta_click"
            analyticsPayload={{ placement: 'comprar-spitz', cta: 'whatsapp', context: 'section', label: 'Atendimento via WhatsApp' }}
          >
            Atendimento via WhatsApp
          </TrackedLink>
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 px-4 py-3 shadow-lg backdrop-blur lg:hidden">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <TrackedLink
            href="/filhotes"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold"
            aria-label="Ver filhotes disponíveis"
            analyticsPayload={{ from: 'comprar-spitz', placement: 'mobile-bar' }}
          >
            Ver filhotes
          </TrackedLink>
          {process.env.NEXT_PUBLIC_WA_PHONE && (
            <TrackedLink
              className="btn-whatsapp inline-flex flex-1 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold"
              target="_blank"
              rel="noreferrer"
              href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), {
                pageType: "intent",
                url: "https://www.byimperiodog.com.br/comprar-spitz-anao",
                intent: "comprar-spitz-anao",
              })}
              aria-label="Atendimento via WhatsApp"
              analyticsEvent="cta_click"
              analyticsPayload={{ placement: 'comprar-spitz', cta: 'whatsapp', context: 'mobile-bar', label: 'WhatsApp' }}
            >
              WhatsApp
            </TrackedLink>
          )}
        </div>
      </div>

      <Script id="intent-article-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="faq-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="howto-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
    </main>
  );
}
