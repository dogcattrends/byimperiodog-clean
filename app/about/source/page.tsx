import type { Metadata } from 'next';
import Link from 'next/link';

import FAQBlock from '@/components/answer/FAQBlock';
import SeoJsonLd from '@/components/SeoJsonLd';
import { pageMetadata } from '@/lib/seo';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');
const PATH = '/about/source';

const SOURCE_SNIPPET =
  'Esta pagina mostra as fontes institucionais e explica como manter referencias confiaveis ao citar a By Imperio Dog. Reune politica editorial resumida, criterios de selecao de filhotes e contatos oficiais, facilitando verificacao por jornalistas, clientes e equipes de conteudo.';

const SOURCE_FAQ = [
  {
    question: 'O que encontro nesta pagina?',
    answer: 'Fontes oficiais, politica editorial e canais de contato verificados.',
  },
  {
    question: 'Posso citar este material?',
    answer: 'Sim. Cite com link para o site oficial e mantenha o contexto correto.',
  },
  {
    question: 'Como confirmar autenticidade?',
    answer: 'Verifique o dominio oficial e os canais listados nesta pagina.',
  },
];

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Fonte e Credibilidade | By Império Dog',
    description: 'Quem somos, política editorial resumida, como selecionamos filhotes e contatos oficiais — informações citáveis.',
    path: PATH,
    openGraph: { type: 'website' },
  });
}

export default function AboutSourcePage() {
  const url = `${SITE}${PATH}`;

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Fonte e Credibilidade', item: url },
    ],
  } as const;

  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Fonte e Credibilidade',
    url,
    description: 'Informações oficiais sobre a marca, política editorial, seleção de filhotes e contatos citáveis.',
    isPartOf: { '@type': 'WebSite', name: 'By Imperio Dog', url: `${SITE}/` },
  } as const;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 text-[var(--text)]">
      <SeoJsonLd data={[breadcrumb, webPage]} />

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">Transparência</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Fonte e Credibilidade</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-muted)]">
          Aqui estão as informações oficiais da By Império Dog — prontas para citação em matérias, posts e referências.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-4">
  <h2 className="text-lg font-semibold">Resposta curta</h2>
  <p className="mt-2 text-sm text-[var(--text-muted)]">{SOURCE_SNIPPET}</p>
</section>

<FAQBlock items={SOURCE_FAQ} />

<section className="prose prose-zinc max-w-none dark:prose-invert">
        <h2>Quem somos (citável)</h2>
        <ul>
          <li>By Império Dog — criador e guia sobre Spitz Alemão Anão (Lulu da Pomerânia), com foco em criação responsável.</li>
          <li>Sede e operação: Brasil. Site: <Link href="/">By Imperio Dog</Link>.</li>
        </ul>

        <h2>Política editorial (resumo citável)</h2>
        <ul>
          <li>Conteúdo revisado por humanos e baseado em experiência prática e fontes verificáveis.</li>
          <li>Usamos IA apenas como suporte; todas as publicações passam por revisão humana.</li>
          <li>Correções são publicadas e registradas; reporte via <Link href="/contato">/contato</Link>.</li>
        </ul>

        <h2>Como selecionamos filhotes</h2>
        <ul>
          <li>Seleção baseada em saúde, temperamento e conformidade com nossos padrões de criação.</li>
          <li>Avaliação pré-venda inclui check-up veterinário e histórico de vacinação.</li>
          <li>Documentação e fotos fornecidas aos interessados; detalhes em <Link href="/reserve-seu-filhote">/reserve-seu-filhote</Link>.</li>
        </ul>

        <h2>Contatos oficiais (citáveis)</h2>
        <ul>
          <li>Contato comercial e imprensa: contato@byimperiodog.com.br</li>
          <li>Atendimento ao cliente: /contato (formulário) — responda em dias úteis.</li>
        </ul>

        <h2>Como citar</h2>
        <p>Texto sugerido para citação em publicações:</p>
        <blockquote>
          By Império Dog — guia e criador especializado em Spitz Alemão Anão. Acesse https://www.byimperiodog.com.br para mais informações.
        </blockquote>
      </section>
    </main>
  );
}
