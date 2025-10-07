import type { Metadata } from 'next';
import { baseSiteMetadata, canonical } from '@/lib/seo.core';
import { Suspense } from 'react';

export const metadata: Metadata = baseSiteMetadata({
  title: 'Busca',
  description: 'Pesquise conteúdos e filhotes no site By Imperio Dog.',
  alternates: { canonical: canonical('/search') }
});

interface SearchItem { id: string|number; url: string; title?: string; name?: string; excerpt?: string }
async function SearchResults({ q }: { q: string }) {
  if (!q) return <p className="text-sm text-zinc-500">Digite um termo para buscar.</p>;
  // MVP: consumir endpoint /api/search?q=...
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/search?q=${encodeURIComponent(q)}`, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error('Falha na busca');
    const data = await res.json();
    const items = data?.results || [];
    if (!items.length) return <p className="text-sm text-zinc-500">Nenhum resultado para &quot;{q}&quot;.</p>;
    return (
      <ul className="space-y-3 mt-4">
        {items.map((r: SearchItem) => (
          <li key={r.id} className="rounded-md border border-zinc-200 p-4 hover:bg-zinc-50 transition">
            <a href={r.url} className="font-medium text-emerald-700 hover:underline">{r.title || r.name}</a>
            {r.excerpt && <p className="text-xs mt-1 text-zinc-600 line-clamp-2">{r.excerpt}</p>}
          </li>
        ))}
      </ul>
    );
  } catch {
    return <p className="text-sm text-rose-600">Erro ao buscar. Tente novamente.</p>;
  }
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams?.q || '').trim();
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 md:py-20">
      <h1 className="text-2xl font-bold tracking-tight">Busca</h1>
      <form className="mt-6 flex gap-3" action="/search" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Pesquisar..."
          className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" type="submit">
          Buscar
        </button>
      </form>
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Carregando...</p>}>
        <SearchResults q={q} />
        <SearchResults q={q} />
      </Suspense>
    </main>
  );
}