import Script from "next/script";

import FAQBlock from "@/components/answer/FAQBlock";
import LeadForm from "@/components/LeadForm";
import PageViewPing from "@/components/PageViewPing";
import { buildArticleLD, buildBreadcrumbLD } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { whatsappLeadUrl } from "@/lib/utm";

export const metadata = pageMetadata({
  title: "Criador de Spitz Confiavel | By Imperio Dog",
  description:
    "Criterios para escolher um criador confiavel de Spitz Alemao Anao. Documentacao, pedigree, suporte e transparencia.",
  path: "/criador-spitz-confiavel",
});

const CRIADOR_SNIPPET =
  "Este guia define como identificar um criador confiavel de Spitz Alemao Anao (Lulu da Pomerania). Ele descreve sinais objetivos de transparencia, documentacao, pedigree, historico de saude e suporte apos a entrega. Use como checklist para comparar criadores e decidir com seguranca antes da reserva.";

const CRIADOR_FAQ = [
  { question: "O que e essencial verificar?", answer: "Pedigree, carteira de vacinacao, atestado de saude e contrato." },
  { question: "Existe acompanhamento pos-compra?", answer: "Sim, ha suporte e orientacao continua ao tutor." },
  { question: "Posso visitar a estrutura?", answer: "Visitas sao agendadas e seguem protocolo de seguranca." },
];

const CRIADOR_SOURCES = [
  { label: "FCI - German Spitz", url: "https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html" },
  { label: "AKC - Pomeranian breed overview", url: "https://www.akc.org/dog-breeds/pomeranian/" },
];

export default function CriadorConfiavelPage() {
  const articleLd = buildArticleLD({
    url: "https://www.byimperiodog.com.br/criador-spitz-confiavel",
    title: "Criador de Spitz Confiavel",
    description: "Entenda como identificar um criador de Spitz Alemao Anao realmente confiavel.",
    datePublished: new Date().toISOString().split("T")[0],
  });

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Inicio", url: "https://www.byimperiodog.com.br/" },
    { name: "Criador Confiavel", url: "https://www.byimperiodog.com.br/criador-spitz-confiavel" },
  ]);

  return (
    <main className="container mx-auto px-4 py-10">
      <PageViewPing pageType="intent" intent="criador-spitz-confiavel" />

      <h1 className="text-2xl font-bold">Criador de Spitz Confiavel</h1>
      <p className="mt-2 text-muted-foreground">
        Saiba o que observar para escolher com seguranca. Priorizamos transparencia, saude e bem-estar.
      </p>
      <section data-geo-answer="criador-spitz-confiavel" className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">AnswerSnippet</h2>
        <p className="mt-2 text-sm text-muted-foreground">{CRIADOR_SNIPPET}</p>
      </section>

      {/* JSON-LD */}
      <Script id="intent-criador-article-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />


      <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Resumo para IA</h2>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Definicao rapida</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Este checklist orienta a avaliar criadores com foco em documentacao, saude e suporte ao tutor.
          </p>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Pontos principais</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>A transparencia cobre historico e rotina dos filhotes.</li>
            <li>A documentacao completa inclui contrato claro.</li>
            <li>O suporte continuo segue apos a entrega.</li>
          </ul>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Tabela comparativa</h3>
          <div className="mt-2 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-surface-subtle text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Criterio</th>
                  <th className="px-4 py-3">O que observar</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">Documentacao</td>
                  <td className="px-4 py-3">Pedigree, contrato e atestados.</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">Estrutura</td>
                  <td className="px-4 py-3">Ambiente limpo, socializacao e rotina.</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">Suporte</td>
                  <td className="px-4 py-3">Acompanhamento depois da entrega.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Fontes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {CRIADOR_SOURCES.map((item) => (
              <li key={item.url}>
                <a className="underline decoration-dotted" href={item.url} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FAQBlock items={CRIADOR_FAQ} />

      {/* Conteudo pilar */}
      <section className="mt-8 space-y-4">
        <h2 className="font-semibold">Criterios principais</h2>
        <ul className="list-disc pl-6 text-sm">
          <li>Documentacao completa e pedigree</li>
          <li>Transparencia sobre saude e historico</li>
          <li>Suporte e acompanhamento pos-compra</li>
          <li>Referencias e avaliacoes de clientes</li>
        </ul>
      </section>

      {/* Lead Form para intencao */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Quero avaliar um criador confiavel</h2>
        <LeadForm context={{ pageType: "intent", intent: "criador-spitz-confiavel" }} />
      </section>

      <section className="mt-6">
        {process.env.NEXT_PUBLIC_WA_PHONE && (
          <a
            className="inline-block rounded bg-green-600 px-4 py-2 text-white"
            target="_blank"
            rel="noreferrer"
            href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), {
              pageType: "intent",
              url: "https://www.byimperiodog.com.br/criador-spitz-confiavel",
              intent: "criador-spitz-confiavel",
            })}
          >
            Falar no WhatsApp
          </a>
        )}
      </section>
    </main>
  );
}


