import type { Metadata } from "next";
import Link from "next/link";

import TOC from "@/components/common/TOC";
import { faqPageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { canonical } from "@/lib/seo.core";

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  const path = "/faq-do-tutor";
  return pageMetadata({
    title: "FAQ do Tutor | By Imperio Dog",
    description: "Perguntas frequentes sobre Spitz Alemão (Lulu da Pomerânia): cuidados, saúde, socialização e suporte ao tutor.",
    path,
  });
}

const qa = [
  {
    question: "Qual a altura e o padrão do Spitz Alemão (Lulu da Pomerânia)?",
    answer:
      "O Spitz Alemão (Lulu da Pomerânia) tem padrão miniatura com até 22 cm de altura. Mantemos seleção responsável, focando saúde, temperamento e estrutura compatível com o padrão.",
  },
  {
    question: "Spitz Alemão Anão (Lulu da Pomerânia) convive bem com crianças?",
    answer:
      "Sim. O Spitz Alemão Anão (Lulu da Pomerânia) é vigilante e muito apegado. Recomendamos supervisão e ensino de manejo gentil às crianças para uma convivência segura e feliz.",
  },
  {
    question: "Quais os cuidados iniciais ao receber o filhote?",
    answer:
      "Nos primeiros dias, priorize rotina calma, alimentação e hidratação adequadas, área de descanso e local de higiene; limite visitas e mantenha esquema vacinal em dia.",
  },
  {
    question: "Como iniciar a socialização do Spitz Alemão (Lulu da Pomerânia)?",
    answer:
      "A socialização começa em casa: sons do cotidiano, diferentes texturas e pessoas. Após liberação do veterinário, amplie experiências com passeios curtos, sempre positivos.",
  },
  {
    question: "Como funciona a garantia de saúde?",
    answer:
      "Entregamos laudos e carteira de vacinação, além de orientações escritas. Nosso compromisso é com transparência e suporte; qualquer intercorrência, fale conosco imediatamente.",
  },
  {
    question: "Quais prazos do processo e como acompanhar?",
    answer:
      "Enviamos atualizações conforme marcos do processo (exames, preparo e logística). Você acompanha os passos e recebe orientações claras para cada etapa.",
  },
  {
    question: "O que é entrega assistida?",
    answer:
      "É a entrega com apoio dedicado: orientamos a ambientação, rotina, alimentação e primeiros cuidados, reforçando o bem-estar do filhote e a tranquilidade do tutor.",
  },
  {
    question: "Como é o suporte ao tutor?",
    answer:
      "Nosso suporte é contínuo. Auxiliamos em dúvidas sobre comportamento, higiene, alimentação e rotinas, para que o Spitz Alemão (Lulu da Pomerânia) se adapte com conforto.",
  },
  {
    question: "Como cuidar da pelagem do Spitz Alemão (Lulu da Pomerânia)?",
    answer:
      "Escovações suaves e regulares evitam nós e mantêm o volume natural. Indicamos produtos adequados à pele sensível e banho com intervalo recomendado pelo groomer/veterinário.",
  },
  {
    question: "Qual a frequência de exercícios?",
    answer:
      "Passeios curtos e brincadeiras diárias bastam para o Spitz Alemão (Lulu da Pomerânia). Observe sinais de cansaço e adapte a intensidade conforme a idade e clima.",
  },
  {
    question: "Quais sinais de alerta de saúde devo observar?",
    answer:
      "Mudanças de apetite, vômitos, diarreia, apatia, tosse ou coceira excessiva merecem atenção. Em caso de dúvida, busque avaliação veterinária.",
  },
  {
    question: "O Spitz Alemão Anão (Lulu da Pomerânia) late muito?",
    answer:
      "É uma raça naturalmente vigilante. Treinamento positivo desde cedo ajuda a direcionar energia e comunicação, mantendo o ambiente equilibrado e tranquilo.",
  },
  {
    question: "Qual ração e rotina alimentar indicadas?",
    answer:
      "Siga orientação do veterinário quanto à composição e quantidade, respeitando idade e sensibilidade individual. Divida em pequenas refeições ao longo do dia para filhotes.",
  },
  {
    question: "Posso viajar com o Spitz Alemão (Lulu da Pomerânia)?",
    answer:
      "Sim, planeje com antecedência: caixa de transporte adequada, documentos atualizados e pausas regulares. Em voos, verifique a política da companhia com antecedência.",
  },
];

export default function Page() {
  const url = canonical("/faq-do-tutor");
  const schema = faqPageSchema(qa, url);
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold">FAQ do Tutor</h1>
      <p className="mt-2 text-slate-600">
        Reunimos respostas para as dúvidas mais comuns sobre o Spitz Alemão (Lulu da Pomerânia): rotina, socialização, saúde e suporte.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-[280px,1fr]">
        <aside className="order-2 md:order-1">
          <TOC containerId="faq-content" />
        </aside>
        <article id="faq-content" className="order-1 space-y-8 md:order-2">
          <section>
            <h2 className="text-xl font-semibold">Tamanho e padrões</h2>
            <p>
              O Spitz Alemão (Lulu da Pomerânia) apresenta padrão miniatura, com até 22 cm de altura. Prezamos por saúde, estrutura e
              comportamento equilibrado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Cuidados iniciais</h2>
            <p>
              Ao chegar em casa, mantenha uma rotina previsível, área segura para descanso e água fresca. Introduza novos estímulos com calma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Socialização</h2>
            <p>
              Trabalhamos socialização precoce e orientamos como continuar o processo. Após liberação do veterinário, passeios breves ajudam na
              adaptação.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Saúde e garantia</h2>
            <p>
              Entregamos documentação, carteira de vacinação e instruções. Qualquer sinal atípico, entre em contato para orientações.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Processo e prazos</h2>
            <p>
              Informamos marcos e prazos do processo e oferecemos comunicação clara em cada etapa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Entrega assistida</h2>
            <p>
              Orientação dedicada na chegada do filhote: rotina, manejo e primeiros cuidados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Suporte ao tutor</h2>
            <p>
              Nosso suporte é contínuo, com orientações sobre rotina, socialização e bem-estar do Spitz Alemão (Lulu da Pomerânia).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Perguntas frequentes</h2>
            <ul className="mt-4 space-y-6">
              {qa.map((q) => (
                <li key={q.question}>
                  <h3 className="text-lg font-medium">{q.question}</h3>
                  <p className="mt-1 text-slate-700">{q.answer}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-wrap gap-3 pt-2">
            <Link href="/filhotes" className="btn-outline inline-flex h-12 items-center justify-center rounded-full px-6 text-sm" aria-label="Ver filhotes">
              Filhotes
            </Link>
            <Link href="/contract" className="btn-outline inline-flex h-12 items-center justify-center rounded-full px-6 text-sm" aria-label="Entenda o processo">
              Processo
            </Link>
            <Link href="/contato" className="btn-outline inline-flex h-12 items-center justify-center rounded-full px-6 text-sm" aria-label="Fale conosco">
              Contato
            </Link>
          </section>
        </article>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </main>
  );
}
