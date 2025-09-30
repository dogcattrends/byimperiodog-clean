import type { Metadata } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Perguntas frequentes | By Império Dog",
  description: "Dúvidas comuns sobre compra, entrega, saúde e pedigree do Spitz Alemão.",
  alternates: { canonical: `${SITE}/faq` },
  robots: { index: true, follow: true },
  openGraph: {
    type: "article",
    url: `${SITE}/faq`,
    title: "Perguntas frequentes | By Império Dog",
    description: "Dúvidas comuns sobre compra, entrega, saúde e pedigree do Spitz Alemão.",
  },
};

const qa = [
  { q: "Como reservo um filhote?", a: "Fale no WhatsApp para contrato e confirmação do pagamento." },
  { q: "Vocês entregam em todo Brasil?", a: "Sim, com opções aérea e terrestre, com todo cuidado." },
  { q: "O filhote tem pedigree?", a: "Sim, com documentação e orientações de transferência." },
  { q: "Como funciona o pós-venda?", a: "Acompanhamos adaptação e saúde, com suporte vitalício." },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-text">
      <h1 className="text-3xl font-bold">Perguntas frequentes</h1>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: qa.map((it) => ({
              "@type": "Question",
              name: it.q,
              acceptedAnswer: { "@type": "Answer", text: it.a },
            })),
          }),
        }}
      />
      <div className="mt-6 divide-y rounded-xl border border-border bg-surface">
        {qa.map((it, i) => (
          <details key={i} className="group p-5">
            <summary className="cursor-pointer list-none text-lg font-semibold">
              {it.q}
            </summary>
            <p className="mt-2 text-textMuted">{it.a}</p>
          </details>
        ))}
      </div>
    </main>
  );
}

