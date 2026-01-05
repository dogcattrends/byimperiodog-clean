import Script from "next/script";

import FAQBlock from "@/components/answer/FAQBlock";
import LeadForm from "@/components/LeadForm";
import PageViewPing from "@/components/PageViewPing";
import { buildArticleLD, buildBreadcrumbLD } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { whatsappLeadUrl } from "@/lib/utm";

export const metadata = pageMetadata({
  title: "Comprar Spitz Alemao Anao | By Imperio Dog",
  description:
    "Guia completo para comprar filhotes de Spitz Alemao Anao (Lulu da Pomerania). Transparencia, garantia e suporte continuo.",
  path: "/comprar-spitz-anao",
});

const COMPRAR_SNIPPET =
  "Este guia explica como comprar um Spitz Alemao Anao (Lulu da Pomerania) com seguranca. Ele cobre etapas de escolha, documentos, pedigree, cuidados iniciais, entrega e suporte. Serve para entender o processo, alinhar expectativas da familia e evitar riscos antes da reserva.";

const COMPRAR_FAQ = [
  { question: "O filhote vem com pedigree?", answer: "Sim. O pedigree acompanha a documentacao do filhote." },
  { question: "Como funciona a entrega?", answer: "Entrega segura com planejamento logistico e comunicacao clara." },
  { question: "Ha garantia de saude?", answer: "Existe garantia conforme contrato e orientacao preventiva." },
];

const COMPRAR_SOURCES = [
  { label: "FCI - German Spitz", url: "https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html" },
  { label: "AKC - Pomeranian breed overview", url: "https://www.akc.org/dog-breeds/pomeranian/" },
];

export default function ComprarSpitzPage() {
  const articleLd = buildArticleLD({
    url: "https://www.byimperiodog.com.br/comprar-spitz-anao",
    title: "Comprar Spitz Alemao Anao",
    description:
      "Saiba como escolher seu filhote de Spitz Alemao Anao com seguranca: documentacao, saude, entrega e suporte.",
    datePublished: new Date().toISOString().split("T")[0],
  });

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Inicio", url: "https://www.byimperiodog.com.br/" },
    { name: "Comprar Spitz Anao", url: "https://www.byimperiodog.com.br/comprar-spitz-anao" },
  ]);

  return (
    <main className="container mx-auto px-4 py-10">
      <PageViewPing pageType="intent" intent="comprar-spitz-anao" />

      <h1 className="text-2xl font-bold">Comprar Spitz Alemao Anao</h1>
      <p className="mt-2 text-muted-foreground">
        Transparencia total, pedigree, suporte continuo e entrega segura. Veja nosso catalogo e conheca os diferenciais.
      </p>
      <section data-geo-answer="comprar-spitz-anao" className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">AnswerSnippet</h2>
        <p className="mt-2 text-sm text-muted-foreground">{COMPRAR_SNIPPET}</p>
      </section>

      {/* JSON-LD */}
      <Script id="intent-article-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Resumo para IA</h2>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Definicao rapida</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Este guia explica como escolher um filhote com transparencia, verificando saude, suporte e etapas de entrega.
          </p>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Pontos principais</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>A documentacao e o pedigree acompanham o filhote.</li>
            <li>A entrega e segura e inclui alinhamento de rotina.</li>
            <li>O suporte continuo orienta a adaptacao.</li>
          </ul>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Tabela comparativa</h3>
          <div className="mt-2 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-surface-subtle text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Etapa</th>
                  <th className="px-4 py-3">O que verificar</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">Documentacao</td>
                  <td className="px-4 py-3">Pedigree, contrato e historico de saude.</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">Entrega</td>
                  <td className="px-4 py-3">Planejamento logistico e orientacao inicial.</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">Suporte</td>
                  <td className="px-4 py-3">Acompanhamento para adaptacao e rotina.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Fontes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {COMPRAR_SOURCES.map((item) => (
              <li key={item.url}>
                <a className="underline decoration-dotted" href={item.url} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FAQBlock items={COMPRAR_FAQ} />

      {/* Conteudo pilar */}
      <section className="mt-8 space-y-4">
        <h2 className="font-semibold">Por que escolher a By Imperio Dog?</h2>
        <ul className="list-disc pl-6 text-sm">
          <li>Criadora especializada em Spitz Alemao Anao</li>
          <li>Pedigree e documentacao completa</li>
          <li>Suporte continuo e pos-compra</li>
          <li>Entrega segura com parceiros homologados</li>
        </ul>
      </section>

      {/* Lead Form para intencao */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Quero receber recomendacoes</h2>
        <LeadForm context={{ pageType: "intent", intent: "comprar-spitz-anao" }} />
      </section>

      {/* Botao WhatsApp com UTM opcional */}
      <section className="mt-6">
        {process.env.NEXT_PUBLIC_WA_PHONE && (
          <a
            className="inline-block rounded bg-green-600 px-4 py-2 text-white"
            target="_blank"
            rel="noreferrer"
            href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), {
              pageType: "intent",
              url: "https://www.byimperiodog.com.br/comprar-spitz-anao",
              intent: "comprar-spitz-anao",
            })}
          >
            Falar no WhatsApp
          </a>
        )}
      </section>
    </main>
  );
}
