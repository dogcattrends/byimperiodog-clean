import Script from "next/script";

import FAQBlock from "@/components/answer/FAQBlock";
import LeadForm from "@/components/LeadForm";
import PageViewPing from "@/components/PageViewPing";
import { buildArticleLD, buildBreadcrumbLD } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { whatsappLeadUrl } from "@/lib/utm";

export const metadata = pageMetadata({
  title: "Criador de Spitz Confiável | By Império Dog",
  description:
    "Critérios para escolher um criador confiável de Spitz Alemão Anão. Documentação, pedigree, suporte e transparência.",
  path: "/criador-spitz-confiavel",
});

const CRIADOR_SNIPPET =
  "Este guia define como identificar um criador confiável de Spitz Alemão Anão (Lulu da Pomerânia). Ele descreve sinais objetivos de transparência, documentação, pedigree, histórico de saúde e suporte após a entrega. Use como checklist para comparar criadores e decidir com segurança antes da reserva.";

const CRIADOR_FAQ = [
  { question: "O que é essencial verificar?", answer: "Pedigree, carteira de vacinação, atestado de saúde e contrato." },
  { question: "Existe acompanhamento pós-compra?", answer: "Sim, há suporte e orientação contínua ao tutor." },
  { question: "Posso visitar a estrutura?", answer: "Visitas são agendadas e seguem protocolo de segurança." },
];

const CRIADOR_SOURCES = [
  { label: "FCI - German Spitz", url: "https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html" },
  { label: "AKC - Pomeranian breed overview", url: "https://www.akc.org/dog-breeds/pomeranian/" },
];

export default function CriadorConfiavelPage() {
  const articleLd = buildArticleLD({
    url: "https://www.byimperiodog.com.br/criador-spitz-confiavel",
    title: "Criador de Spitz Confiável",
    description: "Entenda como identificar um criador de Spitz Alemão Anão realmente confiável.",
    datePublished: new Date().toISOString().split("T")[0],
  });

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: "https://www.byimperiodog.com.br/" },
    { name: "Criador Confiável", url: "https://www.byimperiodog.com.br/criador-spitz-confiavel" },
  ]);

  return (
    <main className="container mx-auto px-4 py-10">
      <PageViewPing pageType="intent" intent="criador-spitz-confiavel" />

      <h1 className="text-2xl font-bold">Criador de Spitz Confiável</h1>
      <p className="mt-2 text-muted-foreground">
        Saiba o que observar para escolher com segurança. Priorizamos transparência, saúde e bem-estar.
      </p>
      <section data-geo-answer="criador-spitz-confiavel" className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Informações</h2>
        <p className="mt-2 text-sm text-muted-foreground">{CRIADOR_SNIPPET}</p>
      </section>

      {/* JSON-LD */}
      <Script id="intent-criador-article-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />


      <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Resumo</h2>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Definição rápida</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Este checklist orienta a avaliar criadores com foco em documentação, saúde e suporte ao tutor.
          </p>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Pontos principais</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>A transparência cobre histórico e rotina dos filhotes.</li>
            <li>A documentação completa inclui contrato claro.</li>
            <li>O suporte contínuo segue após a entrega.</li>
          </ul>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Tabela comparativa</h3>
          <div className="mt-2 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-surface-subtle text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Critério</th>
                  <th className="px-4 py-3">O que observar</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">Documentação</td>
                  <td className="px-4 py-3">Pedigree, contrato e atestados.</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">Estrutura</td>
                  <td className="px-4 py-3">Ambiente limpo, socialização e rotina.</td>
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
        <h2 className="font-semibold">Critérios principais</h2>
        <ul className="list-disc pl-6 text-sm">
          <li>Documentação completa e pedigree</li>
          <li>Transparência sobre saúde e histórico</li>
          <li>Suporte e acompanhamento pós-compra</li>
          <li>Referências e avaliações de clientes</li>
        </ul>
      </section>

      {/* Lead Form para intencao */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Quero avaliar um criador confiável</h2>
        <LeadForm context={{ pageType: "intent", intent: "criador-spitz-confiavel" }} />
      </section>

      <section className="mt-6">
        {process.env.NEXT_PUBLIC_WA_PHONE && (
          <a
            className="btn-whatsapp inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
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


