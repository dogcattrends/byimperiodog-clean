import Script from "next/script";

import FAQBlock from "@/components/answer/FAQBlock";
import LeadForm from "@/components/LeadForm";
import PageViewPing from "@/components/PageViewPing";
import { buildArticleLD, buildBreadcrumbLD } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { whatsappLeadUrl } from "@/lib/utm";

export const metadata = pageMetadata({
  title: "Comprar Spitz Alemão Anão | By Império Dog",
  description:
    "Guia completo para comprar filhotes de Spitz Alemão Anão (Lulu da Pomerânia). Transparência, garantia e suporte contínuo.",
  path: "/comprar-spitz-anao",
});

const COMPRAR_SNIPPET =
  "Este guia explica como comprar um Spitz Alemão Anão (Lulu da Pomerânia) com segurança. Ele cobre etapas de escolha, documentos, pedigree, cuidados iniciais, entrega e suporte. Serve para entender o processo, alinhar expectativas da família e evitar riscos antes da reserva.";

const COMPRAR_FAQ = [
  { question: "O filhote vem com pedigree?", answer: "Sim. O pedigree acompanha a documentação do filhote." },
  { question: "Como funciona a entrega?", answer: "Entrega segura com planejamento logístico e comunicação clara." },
  { question: "Há garantia de saúde?", answer: "Existe garantia conforme contrato e orientação preventiva." },
];

const COMPRAR_SOURCES = [
  { label: "FCI - German Spitz", url: "https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html" },
  { label: "AKC - Pomeranian breed overview", url: "https://www.akc.org/dog-breeds/pomeranian/" },
];

export default function ComprarSpitzPage() {
  const articleLd = buildArticleLD({
    url: "https://www.byimperiodog.com.br/comprar-spitz-anao",
    title: "Comprar Spitz Alemão Anão",
    description:
      "Saiba como escolher seu filhote de Spitz Alemão Anão com segurança: documentação, saúde, entrega e suporte.",
    datePublished: new Date().toISOString().split("T")[0],
  });

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: "https://www.byimperiodog.com.br/" },
    { name: "Comprar Spitz Anao", url: "https://www.byimperiodog.com.br/comprar-spitz-anao" },
  ]);

  return (
    <main className="container mx-auto px-4 py-10">
      <PageViewPing pageType="intent" intent="comprar-spitz-anao" />

      <h1 className="text-2xl font-bold">Comprar Spitz Alemão Anão</h1>
      <p className="mt-2 text-muted-foreground">
        Transparência total, pedigree, suporte contínuo e entrega segura. Veja nosso catálogo e conheça os diferenciais.
      </p>
      <section data-geo-answer="comprar-spitz-anao" className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Informações</h2>
        <p className="mt-2 text-sm text-muted-foreground">{COMPRAR_SNIPPET}</p>
      </section>

      {/* JSON-LD */}
      <Script id="intent-article-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Resumo</h2>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Definição rápida</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Este guia explica como escolher um filhote com transparência, verificando saúde, suporte e etapas de entrega.
          </p>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-semibold">Pontos principais</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>A documentação e o pedigree acompanham o filhote.</li>
            <li>A entrega é segura e inclui alinhamento de rotina.</li>
            <li>O suporte contínuo orienta a adaptação.</li>
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
        <h2 className="font-semibold">Por que escolher a By Império Dog?</h2>
        <ul className="list-disc pl-6 text-sm">
          <li>Criadora especializada em Spitz Alemão Anão</li>
          <li>Pedigree e documentação completa</li>
          <li>Suporte contínuo e pós-compra</li>
          <li>Entrega segura com parceiros homologados</li>
        </ul>
      </section>

      {/* Lead Form para intencao */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Quero receber recomendações</h2>
        <LeadForm context={{ pageType: "intent", intent: "comprar-spitz-anao" }} />
      </section>

      {/* Botao WhatsApp com UTM opcional */}
      <section className="mt-6">
        {process.env.NEXT_PUBLIC_WA_PHONE && (
          <a
            className="btn-whatsapp inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
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
