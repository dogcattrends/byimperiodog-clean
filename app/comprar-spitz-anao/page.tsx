import Script from "next/script";
import { buildArticleLD, buildFAQPageLD, buildBreadcrumbLD } from "@/lib/schema";
import LeadForm from "@/components/LeadForm";
import PageViewPing from "@/components/PageViewPing";
import { whatsappLeadUrl } from "@/lib/utm";

export const metadata = {
  title: "Comprar Spitz Alemão Anão | By Império Dog",
  description:
    "Guia completo para comprar filhotes de Spitz Alemão Anão (Lulu da Pomerânia). Transparência, garantia e suporte vitalício.",
};

export default function ComprarSpitzPage() {
  const articleLd = buildArticleLD({
    url: "https://www.byimperiodog.com.br/comprar-spitz-anao",
    title: "Comprar Spitz Alemão Anão",
    description:
      "Saiba como escolher seu filhote de Spitz Alemão Anão com segurança: documentação, saúde, entrega e suporte.",
    datePublished: new Date().toISOString().split("T")[0],
  });

  const faqLd = buildFAQPageLD([
    { question: "O filhote vem com pedigree?", answer: "Sim, pedigree CBKC incluso." },
    { question: "Como funciona a entrega?", answer: "Entrega segura, com parceiros homologados e rastreamento." },
    { question: "Há garantia de saúde?", answer: "Sim, garantia de 90 dias conforme contrato." },
    { question: "Posso visitar antes de comprar?", answer: "Sim, visitas sob agendamento na região de Bragança Paulista (SP)." },
  ]);

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: "https://www.byimperiodog.com.br/" },
    { name: "Comprar Spitz Anão", url: "https://www.byimperiodog.com.br/comprar-spitz-anao" },
  ]);

  return (
    <main className="container mx-auto px-4 py-10">
      <PageViewPing pageType="intent" intent="comprar-spitz-anao" />
      <h1 className="text-2xl font-bold">Comprar Spitz Alemão Anão</h1>
      <p className="mt-2 text-muted-foreground">
        Transparência total, pedigree CBKC, suporte vitalício e entrega segura. Veja nosso catálogo e conheça os diferenciais.
      </p>

      {/* JSON-LD */}
      <Script id="intent-article-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="intent-faq-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Conteúdo pilar */}
      <section className="mt-8 space-y-4">
        <h2 className="font-semibold">Por que escolher a By Império Dog?</h2>
        <ul className="list-disc pl-6 text-sm">
          <li>Criadora especializada em Spitz Alemão Anão</li>
          <li>Pedigree CBKC e documentação completa</li>
          <li>Suporte vitalício e pós-compra</li>
          <li>Entrega segura com parceiros homologados</li>
        </ul>
      </section>

      {/* Lead Form para intenção */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Quero receber recomendações</h2>
        <LeadForm context={{ pageType: "intent", intent: "comprar-spitz-anao" }} />
      </section>

      {/* Botão WhatsApp com UTM opcional */}
      <section className="mt-6">
        {process.env.NEXT_PUBLIC_WA_PHONE && (
          <a className="inline-block rounded bg-green-600 px-4 py-2 text-white" target="_blank" rel="noreferrer"
             href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), { pageType: "intent", url: "https://www.byimperiodog.com.br/comprar-spitz-anao", intent: "comprar-spitz-anao" })}>
            Falar no WhatsApp
          </a>
        )}
      </section>
    </main>
  );
}




