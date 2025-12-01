import Script from "next/script";
import { buildArticleLD, buildFAQPageLD, buildBreadcrumbLD } from "@/lib/schema";
import LeadForm from "@/components/LeadForm";
import PageViewPing from "@/components/PageViewPing";
import { whatsappLeadUrl } from "@/lib/utm";

export const metadata = {
  title: "Criador de Spitz Confiável | By Império Dog",
  description:
    "Critérios para escolher um criador confiável de Spitz Alemão Anão. Documentação, pedigree, suporte e transparência.",
};

export default function CriadorConfiavelPage() {
  const articleLd = buildArticleLD({
    url: "https://www.byimperiodog.com.br/criador-spitz-confiavel",
    title: "Criador de Spitz Confiável",
    description:
      "Entenda como identificar um criador de Spitz Alemão Anão realmente confiável.",
    datePublished: new Date().toISOString().split("T")[0],
  });

  const faqLd = buildFAQPageLD([
    { question: "O que é essencial verificar?", answer: "Pedigree, carteira de vacinação, atestado de saúde e contrato." },
    { question: "A By Império Dog fornece suporte?", answer: "Sim, suporte vitalício e pós-compra." },
  ]);

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: "https://www.byimperiodog.com.br/" },
    { name: "Criador Confiável", url: "https://www.byimperiodog.com.br/criador-spitz-confiavel" },
  ]);

  return (
    <main className="container mx-auto px-4 py-10">
      <PageViewPing pageType="intent" intent="criador-spitz-confiavel" />
      <h1 className="text-2xl font-bold">Criador de Spitz Confiável</h1>
      <p className="mt-2 text-muted-foreground">
        Saiba o que observar para escolher com segurança. Nós prezamos por transparência, saúde e bem-estar.
      </p>

      {/* JSON-LD */}
      <Script id="intent-criador-article-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="intent-criador-faq-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Conteúdo pilar */}
      <section className="mt-8 space-y-4">
        <h2 className="font-semibold">Critérios principais</h2>
        <ul className="list-disc pl-6 text-sm">
          <li>Documentação completa e pedigree CBKC</li>
          <li>Transparência sobre saúde e histórico</li>
          <li>Suporte e acompanhamento pós-compra</li>
          <li>Referências e avaliações de clientes</li>
        </ul>
      </section>

      {/* Lead Form para intenção */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Quero avaliar um criador confiável</h2>
        <LeadForm context={{ pageType: "intent", intent: "criador-spitz-confiavel" }} />
      </section>

      <section className="mt-6">
        {process.env.NEXT_PUBLIC_WA_PHONE && (
          <a className="inline-block rounded bg-green-600 px-4 py-2 text-white" target="_blank" rel="noreferrer"
             href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), { pageType: "intent", url: "https://www.byimperiodog.com.br/criador-spitz-confiavel", intent: "criador-spitz-confiavel" })}>
            Falar no WhatsApp
          </a>
        )}
      </section>
    </main>
  );
}




