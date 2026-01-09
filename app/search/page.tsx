import type { Metadata } from "next";
import { Suspense } from "react";

import FAQBlock from "@/components/answer/FAQBlock";
import SearchAssist from "@/components/search/SearchAssist";
import { baseSiteMetadata, canonical } from "@/lib/seo.core";

export const metadata: Metadata = baseSiteMetadata({
  title: "Busca | By Império Dog",
  description: "Pesquise conteúdos e filhotes disponíveis pela By Império Dog.",
  alternates: { canonical: canonical("/search") },
  robots: { index: false },
});

const SEARCH_SNIPPET =
  "Use a busca para encontrar guias, páginas e filhotes disponíveis. O objetivo é agilizar o acesso a conteúdos sobre Spitz Alemão Anão (Lulu da Pomerânia), filtrando por temas de rotina, saúde ou localidade. Resultados dependem do termo pesquisado e são atualizados quando novas páginas são publicadas.";

const SEARCH_FAQ = [
  { question: "Por que não vejo resultados?", answer: "Tente termos mais curtos ou verifique a grafia." },
  { question: "A busca inclui filhotes?", answer: "Sim, quando o termo coincide com o catálogo." },
  { question: "Posso buscar por cidade?", answer: "Sim, use o nome da cidade ou estado." },
];

interface SearchItem {
  id: string | number;
  url: string;
  title?: string;
  name?: string;
  excerpt?: string;
}

async function SearchResults({ q }: { q: string }) {
  if (!q) {
    return <p className="text-sm text-zinc-500">Digite um termo para buscar.</p>;
  }

  try {
    const endpoint = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(`${endpoint}/api/search?q=${encodeURIComponent(q)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });

    if (!res.ok) throw new Error("Falha na busca");
    const data = await res.json();
    const items: SearchItem[] = Array.isArray(data?.results) ? data.results : [];

    if (!items.length) {
      return <p className="text-sm text-zinc-500">Nenhum resultado para “{q}”.</p>;
    }

    return (
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border border-zinc-200 p-4 transition hover:bg-zinc-50">
            <a href={item.url} className="font-medium text-emerald-700 hover:underline">
              {item.title || item.name}
            </a>
            {item.excerpt ? (
              <p className="mt-1 text-xs text-zinc-600 line-clamp-2">{item.excerpt}</p>
            ) : null}
          </li>
        ))}
      </ul>
    );
  } catch {
    return <p className="text-sm text-rose-600">Erro ao buscar. Tente novamente.</p>;
  }
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams?.q || "").trim();

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 md:py-20">
      <h1 className="text-2xl font-bold tracking-tight">Busca</h1>
      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Resposta curta</h2>
        <p className="mt-2 text-sm text-zinc-600">{SEARCH_SNIPPET}</p>
      </section>

      <FAQBlock items={SEARCH_FAQ} />

      <SearchAssist defaultQuery={q} />
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Carregando...</p>}>
        <SearchResults q={q} />
      </Suspense>
    </main>
  );
}
