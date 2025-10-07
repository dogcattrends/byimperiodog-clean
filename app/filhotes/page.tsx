import type { Metadata } from "next";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import PuppiesGrid from "@/components/PuppiesGrid";
import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import { CheckCircle, Heart, PawPrint, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Filhotes de Spitz Alemão Anão Lulu da Pomerânia | By Império Dog",
  description:
    "Conheça filhotes de Spitz Alemão Anão Lulu da Pomerânia socializados, com pedigree CBKC, laudos veterinários e acompanhamento vitalício direto com a criadora By Império Dog.",
};

const adoptionSteps = [
  {
    title: "Apresentação acolhedora",
    description: "Entendemos o estilo de vida da família e alinhamos expectativas sobre genética, porte e pelagem do Spitz Alemão Anão Lulu da Pomerânia.",
    detail: "Agenda flexível com videochamada ou visita presencial mediante reserva antecipada.",
  },
  {
    title: "Escolha consciente",
    description: "Enviamos vídeos, laudos, pedigree provisório e ficha comportamental de cada filhote disponível.",
    detail: "Apoio na avaliação de temperamento, necessidades de manejo e preparação do enxoval.",
  },
  {
    title: "Preparar o lar",
    description: "Checklist completo de adaptação, indicação de produtos e plano alimentar personalizado.",
    detail: "Mentoria 1:1 com a criadora para ambientar o filhote com segurança e carinho.",
  },
  {
    title: "Entrega humanizada",
    description: "Retirada presencial na fazenda ou transporte acompanhado por profissional especializado.",
    detail: "Contrato digital, pedigree CBKC, carteira de vacinação e kit de boas-vindas inclusos.",
  },
] as const;

const includedItems = [
  "Pedigree CBKC, contrato digital e termo de garantia genética",
  "Carteira de vacinação, vermifugação e microchip opcional",
  "Check-up veterinário atualizado com exames laboratoriais",
  "Mentoria vitalícia via grupo exclusivo no WhatsApp",
] as const;

const guaranteeHighlights = [
  {
    icon: Shield,
    title: "Transparência total",
    description: "Compartilhamos prontuário, genealogia e documentação de cada filhote em tempo real.",
  },
  {
    icon: Heart,
    title: "Bem-estar em primeiro lugar",
    description: "Ninhadas planejadas, enriquecimento ambiental e socialização com crianças e outros animais.",
  },
  {
    icon: PawPrint,
    title: "Acompanhamento contínuo",
    description: "Planejamento de vacinas, nutrição e comportamento com suporte direto da criadora.",
  },
] as const;

const faqEntries = [
  {
    question: "Fazem envio para outras cidades?",
    answer:
      "Sim. Trabalhamos com transporte humanizado autorizado pelo CRMV. O tutor recebe registros de cada etapa e o filhote viaja acompanhado, com laudos, carteira de vacinação e contrato digital.",
  },
  {
    question: "Quais exames acompanham o filhote?",
    answer:
      "Entregamos com protocolo vacinal compatível à idade, vermifugação, avaliação cardiológica e laudos genéticos dos pais. Microchip e exames complementares podem ser solicitados antecipadamente.",
  },
  {
    question: "Posso visitar a criação antes de decidir?",
    answer:
      "Claro. Agendamos visitas presenciais para conhecer o ambiente e os pais das ninhadas. Para famílias de outras regiões oferecemos tour virtual ao vivo e envio de materiais exclusivos.",
  },
  {
    question: "Como funciona a reserva?",
    answer:
      "Após o alinhamento com a criadora, um sinal garante a prioridade de escolha. O contrato digital é enviado imediatamente e o saldo pode ser quitado na entrega ou em condições personalizadas.",
  },
] as const;

export default function FilhotesPage() {
  const trimmedPhone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = trimmedPhone ? `https://wa.me/${trimmedPhone}` : process.env.NEXT_PUBLIC_WA_LINK ?? "#";

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntries.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="space-y-20 bg-[var(--bg)] pb-24 pt-16 text-[var(--text)]">
      <section className="mx-auto max-w-6xl px-5 text-center sm:text-left">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
          Filhotes com pedigree CBKC
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Filhotes de Spitz Alemão Anão Lulu da Pomerânia com acolhimento e suporte da criadora
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--text-muted)] sm:text-lg">
          Trabalhamos com poucas ninhadas ao ano para garantir saúde, temperamento equilibrado e adaptação tranquila ao novo lar. Descubra os filhotes disponíveis e prepare-se para receber seu Spitz Alemão Anão Lulu da Pomerânia com confiança.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
          <a
            href="#lista-filhotes"
            className={cn(
              buttonVariants({ variant: "solid", size: "lg" }),
              "h-12 rounded-full bg-[var(--brand)] px-6 text-[var(--brand-foreground)] shadow-md hover:shadow-lg"
            )}
          >
            Ver disponibilidade
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 rounded-full border-[var(--brand)] px-6 text-[var(--brand)] hover:bg-[var(--surface-2)]"
            )}
          >
            Conversar com a criadora
          </a>
        </div>
        <dl className="mt-10 grid gap-4 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <dd className="text-2xl font-semibold text-[var(--text)]">Até 3 ninhadas</dd>
            <dt className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
              por ano para garantir cuidado individual
            </dt>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <dd className="text-2xl font-semibold text-[var(--text)]">+180 famílias</dd>
            <dt className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
              acompanhadas com mentoria contínua
            </dt>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <dd className="text-2xl font-semibold text-[var(--text)]">Entrega nacional</dd>
            <dt className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
              logística segura e atualizações em tempo real
            </dt>
          </div>
        </dl>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)]">Como funciona a jornada responsável</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-2" aria-label="Passo a passo" role="list">
            {adoptionSteps.map((step, index) => (
              <li key={step.title} className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                <span className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-[var(--brand-foreground)] shadow">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">{step.title}</h3>
                <p className="mt-3 text-sm text-[var(--text-muted)]">{step.description}</p>
                <p className="mt-4 text-xs text-[var(--text-muted)]/80">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--text)]">O que já vem pronto</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Cada filhote sai preparado para viver em família e com documentação completa.
          </p>
          <ul className="mt-4 space-y-3" role="list">
            {includedItems.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--text)]">
                <CheckCircle className="mt-1 h-4 w-4 flex-none text-[var(--brand)]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--brand)]/40 bg-[var(--surface-2)] p-4 text-sm text-[var(--text-muted)]">
            <strong className="block text-[var(--text)]">Dica da criadora</strong>
            Monte o enxoval com antecedência e envie fotos do espaço para receber sugestões personalizadas.
          </div>
        </aside>
      </section>

      <section id="lista-filhotes" className="mx-auto max-w-6xl space-y-6 px-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text)]">Filhotes disponíveis</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
              Atualizamos esta vitrine em tempo real. Utilize os filtros por cor, sexo e status para encontrar o Spitz Alemão Anão Lulu da Pomerânia ideal.
            </p>
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] shadow-sm hover:brightness-110"
          >
            <WAIcon size={16} className="h-4 w-4" aria-hidden />
            Falar com a criadora
          </a>
        </div>
        <PuppiesGrid />
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-5">
        <h2 className="text-2xl font-semibold text-[var(--text)]">Garantias By Império Dog</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {guaranteeHighlights.map((item) => (
            <article key={item.title} className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <item.icon className="h-6 w-6 text-[var(--brand)]" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-4 px-5">
        <h2 className="text-2xl font-semibold text-[var(--text)]">Perguntas frequentes</h2>
        <div className="space-y-4">
          {faqEntries.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm sm:p-10">
          <h2 className="text-2xl font-semibold text-[var(--text)]">Pronto para receber seu Spitz Alemão Anão Lulu da Pomerânia?</h2>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Conte sua rotina e receba uma curadoria personalizada de filhotes, com vídeos e recomendações sob medida.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "solid", size: "lg" }),
                "h-12 rounded-full bg-[var(--accent)] px-6 text-[var(--accent-foreground)] shadow-md hover:brightness-110"
              )}
            >
              <WAIcon size={18} className="mr-2 inline h-4 w-4" aria-hidden />
              Iniciar conversa agora
            </a>
            <a
              href="#lista-filhotes"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-12 rounded-full px-6 text-[var(--text)] hover:bg-[var(--surface-2)]"
              )}
            >
              Explorar vitrine de filhotes
            </a>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  );
}
