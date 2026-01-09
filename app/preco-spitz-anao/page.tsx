import Script from "next/script";

import FAQBlock from "@/components/answer/FAQBlock";
import LeadForm from "@/components/LeadForm";
import PageViewPing from "@/components/PageViewPing";
import { buildArticleLD, buildBreadcrumbLD } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { whatsappLeadUrl } from "@/lib/utm";

export const metadata = pageMetadata({
  title: "Preço do Spitz Alemão Anão | By Império Dog",
  description:
    "Entenda as faixas de preço do Spitz Alemão Anão: pedigree, linhagem, cor e fatores que influenciam o valor.",
  path: "/preco-spitz-anao",
});

const PRECO_SNIPPET =
  "A página de preço do Spitz Alemão Anão explica quanto custa um filhote e por que os valores variam. Mostra como pedigree, linhagem, cuidados iniciais, disponibilidade e suporte influenciam a faixa final. Serve para estimar investimento e planejar a reserva com informações claras.";

const PRECO_FAQ = [
  { question: "O que influencia o preço?", answer: "Linhagem, cor, demanda, cuidados iniciais e planejamento da ninhada." },
  { question: "O preço inclui suporte?", answer: "Sim. Há orientações iniciais e acompanhamento para adaptação." },
  { question: "Como recebo uma estimativa atualizada?", answer: "Envie o formulário e retornamos com disponibilidade e faixa atual." },
];

const PRECO_SOURCES = [
  { label: "FCI - German Spitz", url: "https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html" },
  { label: "AKC - Pomeranian breed overview", url: "https://www.akc.org/dog-breeds/pomeranian/" },
];

export default function PrecoSpitzPage() {
  const articleLd = buildArticleLD({
    url: "https://www.byimperiodog.com.br/preco-spitz-anao",
    title: "Preço do Spitz Alemão Anão",
    description: "Guia de preços do Spitz Alemão Anão: o que considerar ao investir no seu filhote.",
    datePublished: new Date().toISOString().split("T")[0],
  });

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: "https://www.byimperiodog.com.br/" },
    { name: "Preço Spitz Anão", url: "https://www.byimperiodog.com.br/preco-spitz-anao" },
  ]);

  return (
    <main className="container mx-auto px-4 py-10">
      <PageViewPing pageType="intent" intent="preco-spitz-anao" />

      <h1 className="text-2xl font-bold">Preço do Spitz Alemão Anão</h1>
      <p className="mt-2 text-muted-foreground">
        Conheça as faixas de preço e fatores que influenciam o valor de um filhote de Spitz Alemão Anão.
      </p>
      <section data-geo-answer="preco-spitz-anao" className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Informações</h2>
        <p className="mt-2 text-sm text-muted-foreground">{PRECO_SNIPPET}</p>
      </section>

      {/* JSON-LD */}
      <Script id="intent-preco-article-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Resumo</h2>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Definição rápida</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Este guia explica os fatores que influenciam o investimento em um filhote e o que está incluso no suporte.
          </p>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Pontos principais</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>O preço varia por linhagem, cor e planejamento da ninhada.</li>
            <li>O valor inclui acompanhamento inicial e orientação ao tutor.</li>
            <li>As estimativas atualizadas são enviadas por contato direto.</li>
          </ul>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Tabela comparativa</h3>
          <div className="mt-2 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-surface-subtle text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Fator</th>
                  <th className="px-4 py-3">Impacto no valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">Linhagem</td>
                  <td className="px-4 py-3">Define previsibilidade e histórico de saúde.</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">Socialização</td>
                  <td className="px-4 py-3">Afeta rotina inicial e tempo de dedicação.</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">Suporte</td>
                  <td className="px-4 py-3">Inclui orientação e acompanhamento contínuo.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Fontes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {PRECO_SOURCES.map((item) => (
              <li key={item.url}>
                <a className="underline decoration-dotted" href={item.url} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FAQBlock items={PRECO_FAQ} />

      {/* Conteudo pilar */}
      <section className="mt-8 space-y-4">
        <h2 className="font-semibold">Faixas de preço</h2>
        <p className="text-sm text-muted-foreground">Valores variam conforme padrão, cor e linhagem. Consulte o catálogo para preços atualizados.</p>
      </section>

      {/* Lead Form para intencao */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Quero receber uma estimativa</h2>
        <LeadForm context={{ pageType: "intent", intent: "preco-spitz-anao" }} />
      </section>

      <section className="mt-6">
        {process.env.NEXT_PUBLIC_WA_PHONE && (
          <a
            className="btn-whatsapp inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
            target="_blank"
            rel="noreferrer"
            href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), {
              pageType: "intent",
              url: "https://www.byimperiodog.com.br/preco-spitz-anao",
              intent: "preco-spitz-anao",
            })}
          >
            Falar no WhatsApp
          </a>
        )}
      </section>
    </main>
  );
}

