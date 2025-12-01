import Script from "next/script";
import { buildArticleLD, buildFAQPageLD, buildBreadcrumbLD } from "@/lib/schema";
import LeadForm from "@/components/LeadForm";
import PageViewPing from "@/components/PageViewPing";
import { whatsappLeadUrl } from "@/lib/utm";

export const metadata = {
  title: "Preço do Spitz Alemão Anão | By Império Dog",
  description:
    "Entenda as faixas de preço do Spitz Alemão Anão: pedigree, linhagem, cor e fatores que influenciam o valor.",
};

export default function PrecoSpitzPage() {
  const articleLd = buildArticleLD({
    url: "https://www.byimperiodog.com.br/preco-spitz-anao",
    title: "Preço do Spitz Alemão Anão",
    description:
      "Guia de preços do Spitz Alemão Anão: o que considerar ao investir no seu filhote.",
    datePublished: new Date().toISOString().split("T")[0],
  });

  const faqLd = buildFAQPageLD([
    { question: "O que influencia o preço?", answer: "Linhagem, cor, padrão, pedigree e demanda." },
    { question: "Há condições especiais?", answer: "Eventualmente promoções e condições via contato direto." },
  ]);

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

      {/* JSON-LD */}
      <Script id="intent-preco-article-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="intent-preco-faq-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Conteúdo pilar */}
      <section className="mt-8 space-y-4">
        <h2 className="font-semibold">Faixas de preço</h2>
        <p className="text-sm text-muted-foreground">Valores variam conforme padrão, cor e linhagem. Consulte o catálogo para preços atualizados.</p>
      </section>

      {/* Lead Form para intenção */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Quero receber uma estimativa</h2>
        <LeadForm context={{ pageType: "intent", intent: "preco-spitz-anao" }} />
      </section>

      <section className="mt-6">
        {process.env.NEXT_PUBLIC_WA_PHONE && (
          <a className="inline-block rounded bg-green-600 px-4 py-2 text-white" target="_blank" rel="noreferrer"
             href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), { pageType: "intent", url: "https://www.byimperiodog.com.br/preco-spitz-anao", intent: "preco-spitz-anao" })}>
            Falar no WhatsApp
          </a>
        )}
      </section>
    </main>
  );
}



