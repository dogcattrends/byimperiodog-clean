import SearchBox from '@/components/search/SearchBox';

export const revalidate = 0;

export default async function SearchPage({ searchParams }: { searchParams?: { q?: string } }){
  const q = (searchParams?.q||'').trim();
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-zinc-900">
      <h1 className="text-3xl font-extrabold leading-tight mb-4">Busca</h1>
      <SearchBox initialQ={q} />
      {!q && <p className="mt-4 text-sm text-zinc-600">Digite um termo para buscar no blog.</p>}
    </main>
  );
}
