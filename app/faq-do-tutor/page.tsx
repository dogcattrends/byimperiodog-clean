import type { Metadata } from "next";
import Link from "next/link";

import { LastUpdated } from "@/components/common/LastUpdated";
import { TOC } from "@/components/common/TOC";
import { faqPageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const path = "/faq-do-tutor";

const faqItems = [
  {
    question: "Como a By Império Dog prepara cada Spitz Alemão Lulu da Pomerânia antes da nova família?",
    answer:
      "Os filhotes participam de socialização diária, enriquecimento ambiental, supervisão veterinária e acompanhamento comportamental para chegarem seguros e confiantes ao novo lar.",
  },
  {
    question: "Qual o porte adulto esperado do Spitz Alemão Anão Lulu da Pomerânia?",
    answer:
      "Nossas linhagens são selecionadas para manter estrutura saudável com até 22 cm de altura, ossatura firme e temperamento equilibrado, sempre dentro do padrão oficial.",
  },
  {
    question: "Quais cuidados iniciais garantem uma adaptação tranquila?",
    answer:
      "Prepare um espaço calmo, mantenha a alimentação indicada, ofereça água filtrada, respeite os intervalos de descanso e agende consulta veterinária em até 48 horas após a chegada.",
  },
  {
    question: "Como funciona a entrega segura do Spitz Alemão Lulu da Pomerânia?",
    answer:
      "Organizamos transporte climatizado, equipe treinada e kit de transição; famílias próximas podem optar por entrega presencial com orientação completa.",
  },
  {
    question: "O suporte pós-entrega é contínuo?",
    answer:
      "Sim. Mantemos contato por WhatsApp, videochamadas e biblioteca exclusiva para tirar dúvidas sobre rotina, socialização e saúde em qualquer fase da vida do filhote.",
  },
];

const tocItems = [
  { id: "faq-topicos", label: "Perguntas frequentes" },
  { id: "orientacoes-iniciais", label: "Orientações essenciais" },
  { id: "contato", label: "Fale com a criadora" },
];

const lastUpdated = "2025-10-18T09:00:00.000Z";

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "FAQ do Tutor | By Império Dog",
    description:
      "Perguntas frequentes para tutores do Spitz Alemão Lulu da Pomerânia: preparo, socialização, entrega segura e suporte vitalício.",
    path,
    image: {
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br"}/og/faq-tutor.jpg`,
      alt: "Tutora com um Spitz Alemão Lulu da Pomerânia saudável",
    },
  });
}

export default function FaqDoTutorPage() {
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br").replace(/\/$/, "");
  const jsonLd = faqPageSchema(faqItems, `${siteBase}${path}`);

  return (
    <main className="mx-auto max-w-4xl space-y-12 px-6 py-16 text-zinc-800">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">FAQ do tutor</p>
        <h1 className="text-4xl font-bold text-zinc-900">
          Guia prático para quem recebe um Spitz Alemão Lulu da Pomerânia
        </h1>
        <p className="text-lg text-zinc-600">
          Reunimos orientações sobre rotina, socialização, saúde e suporte contínuo. Use este guia para preparar a casa e a
          família antes de receber o Spitz Alemão Anão Lulu da Pomerânia.
        </p>
      </header>

      <TOC items={tocItems} />

      <section id="faq-topicos" className="space-y-6">
        <h2 className="text-2xl font-semibold text-zinc-900">Perguntas frequentes</h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-zinc-900">{item.question}</h3>
              <p className="mt-2 text-zinc-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="orientacoes-iniciais" className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Orientações essenciais</h2>
        <p className="text-zinc-600">
          Antes da chegada, defina área de descanso, mantenha alimentação indicada e limite visitas. Após liberação veterinária,
          introduza passeios curtos, sempre positivos, para desenvolver a confiança do Spitz Alemão Lulu da Pomerânia.
        </p>
        <ul className="space-y-2 text-zinc-600">
          <li>• Prepare enriquecimento ambiental com texturas, sons e brinquedos seguros.</li>
          <li>• Reforce comandos básicos com reforço positivo e sessões curtas.</li>
          <li>• Mantenha a agenda de vacinas conforme orientação veterinária.</li>
        </ul>
      </section>

      <section id="contato" className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Fale com a criadora</h2>
        <p className="text-zinc-600">
          Precisa de orientação adicional? Envie suas dúvidas pelo WhatsApp, agende videochamada ou consulte nossa biblioteca
          exclusiva de materiais para tutores.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://wa.me/5511986633239?text=Olá! Gostaria de saber mais sobre o Spitz Alemão Lulu da Pomerânia."
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
          >
            Falar no WhatsApp
          </a>
          <Link
            href="/contato"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Ver canais de contato
          </Link>
        </div>
      </section>

      <LastUpdated buildTime={process.env.NEXT_PUBLIC_BUILD_TIME} contentTime={lastUpdated} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
