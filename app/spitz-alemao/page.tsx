import type { Metadata } from "next";

import TrackedLink from "../../src/components/ui/TrackedLink";
import { EditorialWhatsAppCTA } from "../components/EditorialWhatsAppCTA";
import { ArticleJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "../components/JsonLdBlocks";
// Dados estruturados para Discover/SEO
const ARTICLE_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Spitz Alemão: Guia Completo, Origem, Cuidados e Filhotes",
  "description": "Tudo sobre Spitz Alemão: características, personalidade, cuidados, filhotes e como escolher o criador ideal.",
  "image": [
    "https://www.byimperiodog.com.br/og/spitz-alemao.png"
  ],
  "author": {
    "@type": "Organization",
    "name": "By Império Dog"
  },
  "publisher": {
    "@type": "Organization",
    "name": "By Império Dog",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.byimperiodog.com.br/byimperiologo.svg"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.byimperiodog.com.br/spitz-alemao"
  }
};

const BREADCRUMB_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Início",
      "item": "https://www.byimperiodog.com.br/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Spitz Alemão",
      "item": "https://www.byimperiodog.com.br/spitz-alemao"
    }
  ]
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Qual a diferença entre Spitz Alemão e Lulu da Pomerânia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O Lulu da Pomerânia é o Spitz Alemão de porte anão, sendo a menor variedade da raça. Ambos compartilham origem, mas o Lulu é mais compacto e tem pelagem ainda mais exuberante."
      }
    },
    {
      "@type": "Question",
      "name": "Quais cuidados essenciais com o Spitz Alemão?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Escovação frequente, socialização desde filhote, alimentação balanceada e acompanhamento veterinário são fundamentais para saúde e bem-estar."
      }
    },
    {
      "@type": "Question",
      "name": "Como escolher um criador de confiança?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Busque criadores que ofereçam transparência, documentação, suporte e referências."
      }
    }
  ]
};

export const metadata: Metadata = {
  title: "Spitz Alemão: Guia Completo, Origem, Cuidados e Filhotes | By Império Dog",
  description: "Tudo sobre Spitz Alemão: características, personalidade, cuidados, filhotes e como escolher o criador ideal. Conteúdo exclusivo, atualizado e focado em tutores exigentes.",
  openGraph: {
    title: "Spitz Alemão: Guia Completo, Origem, Cuidados e Filhotes | By Império Dog",
    description: "Tudo sobre Spitz Alemão: características, personalidade, cuidados, filhotes e como escolher o criador ideal.",
    url: "/spitz-alemao",
    images: [
      { url: "/og/spitz-alemao.png", width: 1200, height: 630, alt: "Spitz Alemão - By Império Dog" }
    ]
  }
};

export default function SpitzAlemaoPage() {
  const DATA_PUBLICACAO = "Publicado em 10 de janeiro de 2024";
  const DATA_ATUALIZACAO = "Atualizado em 13 de janeiro de 2026";
  const AUTOR = "Por By Império Dog";
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {/* Blocos JSON-LD para Discover/SEO */}
      <ArticleJsonLd ld={ARTICLE_LD} />
      <BreadcrumbJsonLd ld={BREADCRUMB_LD} />
      <FAQJsonLd ld={FAQ_LD} />

      <figure className="mb-8">
        <img
          src="/og/spitz-alemao.png"
          alt="Spitz Alemão - By Império Dog"
          className="w-full rounded-2xl shadow-lg object-cover max-h-[420px] mx-auto"
          style={{ aspectRatio: '2/1', background: '#f3f3f3' }}
        />
        <figcaption className="text-xs text-zinc-500 text-center mt-2">Imagem ilustrativa: Spitz Alemão</figcaption>
      </figure>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="text-sm text-zinc-500">{AUTOR}</span>
        <span className="text-sm text-zinc-500">{DATA_PUBLICACAO}</span>
        <span className="text-sm text-zinc-500">{DATA_ATUALIZACAO}</span>
      </div>

      <h1 className="text-4xl font-bold mb-4">Spitz Alemão: O Pequeno Leão de Personalidade Gigante</h1>
      <p className="text-lg text-zinc-700 mb-6">
        O Spitz Alemão é muito mais do que aparência: por trás da pelagem exuberante, existe uma história de companheirismo, inteligência e curiosidades que surpreendem até tutores experientes. Descubra neste guia tudo o que ninguém te conta sobre a rotina, os mitos e as alegrias de conviver com esse cão tão carismático.
      </p>
      <ul className="list-disc pl-6 mb-8 text-zinc-800">
        <li><TrackedLink href="/lulu-da-pomerania" analyticsPayload={{ from: 'spitz-alemao' }}>Diferença entre Spitz Alemão e Lulu da Pomerânia</TrackedLink></li>
        <li><TrackedLink href="/comprar-spitz-anao" analyticsPayload={{ from: 'spitz-alemao' }}>Como comprar um Spitz com segurança</TrackedLink></li>
        <li><TrackedLink href="/criador-spitz-confiavel" analyticsPayload={{ from: 'spitz-alemao' }}>Clique aqui: Saiba como Identificar um Criador Confiável</TrackedLink></li>
        <li><TrackedLink href="/faq-do-tutor" analyticsPayload={{ from: 'spitz-alemao' }}>Perguntas frequentes sobre a raça</TrackedLink></li>
      </ul>
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Características do Spitz Alemão</h2>
        <p className="mb-2">Inteligente, leal, alerta e extremamente apegado à família. O Spitz Alemão se destaca pelo porte elegante, pelagem exuberante e personalidade marcante.</p>
        <p className="mb-2">Ideal para quem busca companhia, alegria e um cão de fácil adaptação em ambientes familiares.</p>
      </section>
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Cuidados Essenciais</h2>
        <ul className="list-disc pl-6">
          <li>Escovação frequente para manter a pelagem saudável</li>
          <li>Socialização desde filhote</li>
          <li>Alimentação balanceada e acompanhamento veterinário</li>
          <li>Atividades para estimular mente e corpo</li>
        </ul>
      </section>
      {/* Seção: Preço do Spitz Alemão */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Quanto custa um Spitz Alemão?</h2>
        <p className="mb-2">O preço do Spitz Alemão pode variar conforme linhagem, pedigree, cor, tamanho e reputação do criador. Em geral, filhotes de Spitz Anão (Lulu da Pomerânia) são mais valorizados. Sempre busque criadores éticos e evite ofertas suspeitas.</p>
        <TrackedLink href="/comprar-spitz-anao" analyticsPayload={{ from: 'spitz-alemao-preco' }} className="text-blue-600 underline">Veja dicas para comprar com segurança</TrackedLink>
      </section>

      {/* Seção: Cores e Tamanhos */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Cores e tamanhos do Spitz Alemão</h2>
        <p className="mb-2">O Spitz Alemão pode ser encontrado em diversas cores: branco, preto, laranja, creme, chocolate, particolor e outros. Os tamanhos variam entre anão (Lulu da Pomerânia), pequeno, médio e grande, cada um com características próprias.</p>
      </section>

      {/* Seção: Comportamento e Adestramento */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Comportamento e adestramento</h2>
        <p className="mb-2">O Spitz é inteligente, aprende rápido e responde bem ao adestramento positivo. Socialização precoce é fundamental para evitar latidos excessivos e ansiedade de separação.</p>
      </section>

      {/* Seção: Saúde e Alimentação */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Saúde e alimentação</h2>
        <p className="mb-2">A saúde do Spitz depende de boa alimentação, vacinação em dia, visitas regulares ao veterinário e atenção a problemas comuns da raça, como luxação de patela e problemas dentários.</p>
      </section>

      {/* Seção: Filhotes de Spitz Alemão */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Filhotes de Spitz Alemão</h2>
        <p className="mb-2">Filhotes exigem cuidados redobrados: alimentação específica, socialização, vacinação e acompanhamento veterinário. O período de adaptação é essencial para um desenvolvimento saudável.</p>
        <TrackedLink href="/reserve-seu-filhote" analyticsPayload={{ from: 'spitz-alemao-filhote' }} className="text-blue-600 underline">Reserve seu filhote com criador de confiança</TrackedLink>
      </section>

      {/* Seção: Perguntas Frequentes (FAQ Expandido) */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Perguntas frequentes sobre Spitz Alemão</h2>
        <ul className="space-y-4">
          <li>
            <strong>Spitz Alemão e Lulu da Pomerânia são a mesma raça?</strong><br />
            Sim, o Lulu da Pomerânia é a variedade anã do Spitz Alemão, sendo a menor e mais popular.
          </li>
          <li>
            <strong>Qual o valor médio de um filhote?</strong><br />
            O valor pode variar de acordo com linhagem, cor e criador, mas filhotes de qualidade costumam ter preço mais elevado.
          </li>
          <li>
            <strong>Quais as cores mais comuns?</strong><br />
            Branco, laranja, preto, creme e particolor são algumas das cores mais procuradas.
          </li>
          <li>
            <strong>Spitz Alemão late muito?</strong><br />
            A raça é alerta e pode latir para avisar novidades, mas o adestramento ajuda a controlar o excesso de latidos.
          </li>
          <li>
            <strong>Como evitar problemas de saúde?</strong><br />
            Escolha criadores responsáveis, mantenha vacinação e check-ups em dia, e ofereça alimentação de qualidade.
          </li>
          <li>
            <strong>Spitz se adapta bem a apartamento?</strong><br />
            Sim, desde que tenha rotina de passeios, brincadeiras e enriquecimento ambiental.
          </li>
        </ul>
        <TrackedLink href="/faq-do-tutor" analyticsPayload={{ from: 'spitz-alemao-faq' }} className="text-blue-600 underline mt-4 inline-block">Veja todas as perguntas frequentes</TrackedLink>
      </section>

      <EditorialWhatsAppCTA />
    </main>
  );
}
