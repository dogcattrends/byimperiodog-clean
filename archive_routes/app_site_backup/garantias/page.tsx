import type { Metadata } from "next";
import Script from "next/script";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Garantias e saúde | By Império Dog",
  description:
    "Nossas garantias: pedigree, vacinação/verminação em dia, contrato transparente e acompanhamento de saúde.",
  alternates: { canonical: `${SITE}/garantias` },
};

export default function GarantiasPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Garantias", item: `${SITE}/garantias` },
    ],
  };
  const items = [
    { h: "Pedigree", p: "Filhotes com pedigree reconhecido e documentação organizada." },
    { h: "Saúde", p: "Vacinação e vermifugação em dia, check-up veterinário antes da entrega." },
    { h: "Contrato", p: "Contrato digital simples, transparente e seguro para as duas partes." },
    { h: "Suporte", p: "Orientação de adaptação e acompanhamento vitalício no pós-venda." },
  ];
  return (
  <main className="mx-auto max-w-5xl px-6 py-10 text-text">
      <Script id="ld-breadcrumb-garantias" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
  <h1 className="text-3xl font-bold">Garantias</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((it) => (
          <section key={it.h} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-xl font-semibold">{it.h}</h2>
            <p className="text-textMuted">{it.p}</p>
          </section>
        ))}
      </div>
    </main>
  );
}

