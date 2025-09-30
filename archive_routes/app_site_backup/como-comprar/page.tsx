import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const WA = process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/5511999999999";

export const metadata: Metadata = {
  title: "Como comprar seu Spitz Alemão | By Império Dog",
  description:
    "Veja como funciona nosso processo de compra: escolha, reserva, contrato, preparo e entrega do seu Spitz Alemão Anão.",
  alternates: { canonical: `${SITE}/como-comprar` },
};

export default function ComoComprarPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Como comprar", item: `${SITE}/como-comprar` },
    ],
  };
  const steps = [
    { t: "Escolha", d: "Veja os filhotes disponíveis e fale com um especialista." },
    { t: "Reserva", d: "Enviamos contrato digital e orientações de pagamento." },
    { t: "Preparo", d: "Check-up, vacinação e documentação organizada." },
    { t: "Entrega", d: "Retirada no canil ou entrega aérea/terrestre segura." },
    { t: "Pós-venda", d: "Acompanhamento e suporte vitalício." },
  ];
  return (
  <main className="mx-auto max-w-5xl px-6 py-10 text-text">
      <Script id="ld-breadcrumb-comprar" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
  <h1 className="text-3xl font-bold">Como comprar</h1>
  <p className="mt-2 text-textMuted">
        Processo simples, transparente e seguro para você receber seu Spitz com todo carinho e responsabilidade.
      </p>
      <ol className="mt-6 grid gap-4 sm:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.t} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="text-sm text-textMuted">Passo {i + 1}</div>
            <div className="mt-1 text-lg font-semibold">{s.t}</div>
            <p className="text-textMuted">{s.d}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex gap-3">
        <Link href="/filhotes" className="btn-base bg-accent text-on-accent px-5 py-3 font-semibold focus-visible:outline-none focus-ring-accent">
          Ver filhotes disponíveis
        </Link>
        <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-base bg-whatsapp text-on-whatsapp px-5 py-3 font-semibold focus-visible:outline-none focus-ring" >
          Falar no WhatsApp
        </a>
      </div>
    </main>
  );
}

