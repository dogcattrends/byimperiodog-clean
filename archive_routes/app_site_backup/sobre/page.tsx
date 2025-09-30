import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import Link from "next/link";
import { PawPrint, GraduationCap, Users, BookOpen, Layers, Stethoscope } from "lucide-react";
import { routes } from "@/lib/route";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br";
const WA = process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/5511999999999";
const WA_MSG = "Olá! Vim do site By Imperio Dog e quero saber sobre filhotes disponíveis.";

export const metadata: Metadata = {
  title: "Sobre Nós | By Imperio Dog",
  description:
  "Conheça a história, a filosofia e o cuidado por trás do canil By Imperio Dog. Amor, saúde e transparência com Spitz Alemão (Lulu da Pomerânia).",
  alternates: { canonical: `${SITE}/sobre` },
  openGraph: {
  title: "Sobre Nós | By Imperio Dog",
    description:
  "Conheça a história, a filosofia e o cuidado por trás do canil By Imperio Dog.",
    url: `${SITE}/sobre`,
  siteName: "By Imperio Dog",
    images: [{ url: "/spitz-hero-desktop.webp" }],
  },
};

const TIMELINE = [
  { ano: "2013", texto: "Início do projeto com foco em cães de companhia equilibrados.", Icon: PawPrint },
  { ano: "2015", texto: "Primeiras matrizes selecionadas e padronização de manejo.", Icon: Layers },
  { ano: "2018", texto: "Rotina de socialização ampliada para filhotes mais confiantes.", Icon: Users },
  { ano: "2021", texto: "Estrutura de pós‑venda com orientação contínua às famílias.", Icon: BookOpen },
  { ano: "2023", texto: "Conteúdos educativos e reforço na transparência de processos.", Icon: GraduationCap },
  { ano: "2025", texto: "Parcerias veterinárias e melhoria contínua de bem‑estar.", Icon: Stethoscope },
] as const;

export default function SobrePage() {
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
  name: "By Imperio Dog",
    url: SITE,
    sameAs: ["https://instagram.com/byimperiodog", "https://youtube.com/@byimperiodog"],
    logo: `${SITE}/spitz-hero-desktop.webp`,
    description:
      "Criadores focados em bem‑estar, socialização e transparência no acompanhamento de Spitz Alemão (Lulu da Pomerânia).",
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Sobre", item: `${SITE}/sobre` },
    ],
  };

  return (
  <main className="mx-auto max-w-6xl px-6 py-12 text-[var(--text)]">
      <Script id="ld-org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <Script id="ld-breadcrumb-sobre" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* Hero */}
      <section className="grid gap-10 md:grid-cols-2 items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
            Sobre o By Imperio Dog
          </h1>
          <p className="mt-3 leading-relaxed">
            Somos apaixonados por Spitz Alemão (Lulu da Pomerânia). Nosso trabalho prioriza saúde, temperamento e
            socialização — sempre com transparência em cada etapa, do primeiro contato ao pós‑venda.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href={routes.filhotes} className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 font-semibold text-on-brand shadow hover:brightness-110 focus-visible:focus-ring">
              Ver filhotes disponíveis
            </Link>
            <a
              href={`${WA}?text=${encodeURIComponent(WA_MSG)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-[var(--border)] px-5 py-2.5 font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:focus-ring"
            >
              WhatsApp
            </a>
          </div>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-zinc-200">
          <Image
            src="/spitz-hero-desktop.webp"
            alt="Spitz Alemão feliz no colo"
            fill
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* Pilares */}
      <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Saúde em 1º lugar",
            text:
              "Acompanhamento veterinário, calendário de vacinação, vermifugação e orientação nutricional conforme a idade.",
          },
          {
            title: "Temperamento & Socialização",
            text:
              "Manejo gentil e estímulos diários para filhotes seguros, adaptáveis e próximos da família.",
          },
          {
            title: "Transparência",
            text:
              "Comunicação clara sobre linhagem, documentos e cuidados. Acompanhamos você durante e após a compra.",
          },
          {
            title: "Responsabilidade",
            text:
              "Boas práticas de bem‑estar e ambiente limpo, com foco na qualidade de vida dos cães.",
          },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-muted)]">{c.text}</p>
          </div>
        ))}
      </section>

      {/* História */}
      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Nossa essência</h2>
          <p className="mt-3 leading-relaxed">
            O By Império Dog nasceu da admiração por cães de companhia equilibrados, com foco especial no Spitz
            Alemão. Ao longo do tempo, aperfeiçoamos rotina, manejo e socialização para entregar filhotes preparados
            para a vida em família: seguros, curiosos e afetuosos.
          </p>
          <p className="mt-3 leading-relaxed">
            Trabalhamos com checklist de saúde, orientação de adaptação e suporte no pós‑venda. Valorizamos a confiança
            construída com cada família — ela é a base do nosso trabalho diário.
          </p>
        </div>
  <ul className="grid gap-3 content-start">
          <li className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
            <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">Checklist de saúde e carteira de vacinação conforme idade</p>
          </li>
          <li className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
            <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">Orientações de adaptação, higiene, nutrição e enriquecimento</p>
          </li>
          <li className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
            <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">Suporte dedicado no pós‑venda</p>
          </li>
        </ul>
      </section>

      {/* Garantias */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">Compromissos ao entregar um filhote</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="font-semibold">Acompanhamento de saúde</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-muted)]">
              Informamos o histórico de vacinação e vermifugação, orientamos próxima dose e cuidados iniciais. Para
              questões específicas, recomendamos avaliação com seu veterinário de confiança.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="font-semibold">Documentação e orientação</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-muted)]">
              Disponibilizamos documentos do filhote conforme a modalidade combinada (ex.: microchip, pedigree, notas
              fiscais quando aplicável) e orientações de adaptação.
            </p>
          </div>
        </div>
      </section>

      {/* Nossa missão */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">Nossa missão</h2>
        <p className="mt-3 max-w-3xl leading-relaxed">
          Promover bem‑estar, saúde e vínculo entre famílias e seus Spitz Alemão. Fazemos isso com manejo responsável,
          socialização positiva e acompanhamento próximo antes e depois da chegada do filhote.
        </p>
      </section>

      {/* Linha do tempo */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">Linha do tempo</h2>
        <ol className="mt-6 space-y-5">
          {TIMELINE.map((t, i) => (
            <li key={i} className="relative pl-16">
              <span className="absolute left-0 top-1 inline-flex h-8 items-center justify-center rounded-full bg-brand px-3 text-xs font-semibold text-on-brand shadow">
                {t.ano}
              </span>
              <div className="flex items-start gap-3">
                <t.Icon className="mt-0.5 h-5 w-5 text-zinc-700" />
                <p className="leading-relaxed">{t.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Perguntas frequentes */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">Perguntas frequentes</h2>
  <div className="mt-4 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {[
            {
              q: "Quais documentos acompanham o filhote?",
              a: "Conforme a modalidade combinada: carteira de vacinação, microchip e/ou pedigree, e orientações iniciais.",
            },
            {
              q: "Como funciona o acompanhamento de saúde?",
              a: "Indicamos o histórico de vacina/vermífugo e orientamos próxima dose. Para casos específicos, procure seu veterinário de confiança.",
            },
            {
              q: "Vocês entregam para outras cidades?",
              a: "Avaliamos opções seguras de transporte conforme o caso. Fale conosco no WhatsApp para verificarmos rotas e prazos.",
            },
          ].map((f, i) => (
            <details key={i} className="group p-5">
              <summary className="cursor-pointer list-none font-medium focus:outline-none focus-visible:focus-ring">
                {f.q}
              </summary>
              <p className="mt-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mt-16 rounded-2xl bg-brand p-8 text-center text-on-brand">
        <h2 className="text-xl font-bold">Pronto para conhecer nossos filhotes?</h2>
        <p className="mt-1 text-on-brand/90">Fale com a equipe e tire suas dúvidas.</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href={routes.filhotes} className="rounded-full bg-[var(--surface)] px-5 py-2.5 font-semibold text-[var(--text)] shadow hover:opacity-95 focus-visible:focus-ring">
            <span className="underline decoration-brand underline-offset-4">Ver filhotes</span>
          </Link>
          <a
            href={`${WA}?text=${encodeURIComponent(WA_MSG)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-brand/50 px-5 py-2.5 font-semibold text-on-brand hover:bg-brand/10 focus-visible:focus-ring"
          >
            WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
