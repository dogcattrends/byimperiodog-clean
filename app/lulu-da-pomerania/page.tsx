import type { Metadata } from "next";

import TrackedLink from "../../src/components/ui/TrackedLink";
import { EditorialWhatsAppCTA } from "../components/EditorialWhatsAppCTA";
import { ArticleJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "../components/JsonLdBlocks";
// Dados estruturados para Discover/SEO
const ARTICLE_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Lulu da Pomerânia: Guia Completo, Diferenças, Cuidados e Filhotes",
  "description": "Tudo sobre Lulu da Pomerânia: origem, personalidade, diferenças para Spitz Alemão, cuidados, filhotes e como escolher o criador ideal.",
  "image": [
    "https://www.byimperiodog.com.br/og/lulu-da-pomerania.png"
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
    "@id": "https://www.byimperiodog.com.br/lulu-da-pomerania"
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
      "name": "Lulu da Pomerânia",
      "item": "https://www.byimperiodog.com.br/lulu-da-pomerania"
    }
  ]
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "O Lulu da Pomerânia é o mesmo que Spitz Alemão?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O Lulu da Pomerânia é a menor variedade do Spitz Alemão, também chamado de Spitz Alemão Anão. Compartilham origem, mas o Lulu é mais compacto e tem pelagem ainda mais exuberante."
      }
    },
    {
      "@type": "Question",
      "name": "Quais cuidados especiais o Lulu da Pomerânia exige?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Escovação diária, socialização, alimentação de alta qualidade e visitas regulares ao veterinário são essenciais."
      }
    },
    {
      "@type": "Question",
      "name": "Como garantir um filhote saudável?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Escolha criadores que ofereçam transparência, documentação, suporte e referências."
      }
    }
  ]
};

export const metadata: Metadata = {
  title: "Lulu da Pomerânia: Guia Completo, Diferenças, Cuidados e Filhotes | By Império Dog",
  description: "Tudo sobre Lulu da Pomerânia: origem, personalidade, diferenças para Spitz Alemão, cuidados, filhotes e como escolher o criador ideal.",
  openGraph: {
    title: "Lulu da Pomerânia: Guia Completo, Diferenças, Cuidados e Filhotes | By Império Dog",
    description: "Tudo sobre Lulu da Pomerânia: origem, personalidade, diferenças para Spitz Alemão, cuidados, filhotes e como escolher o criador ideal.",
    url: "/lulu-da-pomerania",
    images: [
      { url: "/og/lulu-da-pomerania.png", width: 1200, height: 630, alt: "Lulu da Pomerânia - By Império Dog" }
    ]
  }
};

export default function LuluDaPomeraniaPage() {
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
          src="/og/lulu-da-pomerania.png"
          alt="Lulu da Pomerânia - By Império Dog"
          className="w-full rounded-2xl shadow-lg object-cover max-h-[420px] mx-auto"
          style={{ aspectRatio: '2/1', background: '#f3f3f3' }}
        />
        <figcaption className="text-xs text-zinc-500 text-center mt-2">Imagem ilustrativa: Lulu da Pomerânia</figcaption>
      </figure>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="text-sm text-zinc-500">{AUTOR}</span>
        <span className="text-sm text-zinc-500">{DATA_PUBLICACAO}</span>
        <span className="text-sm text-zinc-500">{DATA_ATUALIZACAO}</span>
      </div>

      <h1 className="text-4xl font-bold mb-4">Lulu da Pomerânia: Pequeno no Tamanho, Gigante no Carisma</h1>
      <p className="text-lg text-zinc-700 mb-6">
        O Lulu da Pomerânia é muito mais do que fofura: por trás do porte anão e da pelagem marcante, existe uma personalidade surpreendente, cheia de curiosidades e histórias que encantam famílias no mundo todo. Descubra neste guia o que faz do Lulu um cão tão especial — e por que ele conquista corações há gerações.
      </p>
      <ul className="list-disc pl-6 mb-8 text-zinc-800">
        <li><TrackedLink href="/spitz-alemao" analyticsPayload={{ from: 'lulu-da-pomerania' }}>O que é um Spitz Alemão?</TrackedLink></li>
        <li><TrackedLink href="/comprar-spitz-anao" analyticsPayload={{ from: 'lulu-da-pomerania' }}>Como comprar um Lulu da Pomerânia com segurança</TrackedLink></li>
        <li><TrackedLink href="/criador-spitz-confiavel" analyticsPayload={{ from: 'lulu-da-pomerania' }}>Clique aqui: Saiba como Identificar um Criador Confiável</TrackedLink></li>
        <li><TrackedLink href="/faq-do-tutor" analyticsPayload={{ from: 'lulu-da-pomerania' }}>Perguntas frequentes sobre o Lulu</TrackedLink></li>
      </ul>
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Personalidade e Diferenças</h2>
        <p className="mb-2">O Lulu da Pomerânia é alegre, sociável, muito apegado ao tutor e adora ser o centro das atenções. Sua principal diferença para outros Spitz é o porte anão e o temperamento ainda mais extrovertido.</p>
      </section>
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Cuidados Especiais</h2>
        <ul className="list-disc pl-6">
          <li>Escovação diária para evitar nós e manter o brilho</li>
          <li>Socialização e estímulo mental</li>
          <li>Alimentação de alta qualidade</li>
          <li>Visitas regulares ao veterinário</li>
        </ul>
      </section>
      <EditorialWhatsAppCTA />
    </main>
  );
}
