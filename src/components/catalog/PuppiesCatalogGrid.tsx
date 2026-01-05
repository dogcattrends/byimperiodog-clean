import PuppyCatalogCard from "@/components/catalog/PuppyCatalogCard";
import type { Puppy } from "@/domain/puppy";

type Props = {
  items: Puppy[];
};

export default function PuppiesCatalogGrid({ items }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <section className="py-16">
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center">
            <svg className="mx-auto h-10 w-10 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 21l-4.35-4.35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="11" cy="11" r="8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="mt-6 text-xl font-semibold text-zinc-900">Nenhum filhote encontrado</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Ajuste os filtros ou entre em contato direto para saber sobre novas ninhadas.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full" aria-label="Catálogo de filhotes">
      {/* Mobile carousel (peek + snap) */}
      <div className="sm:hidden px-4">
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
          {items.map((p) => (
            <div key={p.id} className="min-w-[82%] snap-start">
              <PuppyCatalogCard puppy={p} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden sm:block mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-7 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <PuppyCatalogCard key={p.id} puppy={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
