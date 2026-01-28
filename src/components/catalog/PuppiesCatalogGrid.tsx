import PuppyCatalogCard from "@/components/catalog/PuppyCatalogCard";
import type { Puppy } from "@/domain/puppy";

type Props = {
 items: Puppy[];
};

function normalizeSex(value?: string | null) {
 const raw = String(value ?? "").toLowerCase().trim();
 if (raw === "male" || raw === "macho") return "male";
 if (raw === "female" || raw === "femea" || raw === "fêmea") return "female";
 return "unknown";
}

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

 const females: Puppy[] = [];
 const males: Puppy[] = [];
 const unknown: Puppy[] = [];

 for (const p of items) {
 const sex = normalizeSex((p as any).sex ?? (p as any).sexo ?? (p as any).gender ?? null);
 if (sex === "female") {
 females.push(p);
 } else if (sex === "male") {
 males.push(p);
 } else {
 unknown.push(p);
 }
 }

 const maleWithUnknown = [...males, ...unknown];

 return (
	<div className="w-full" aria-label="Catalogo de filhotes">
	<div className="space-y-10">
	{/* Mobile carousel (peek + snap) */}
 <div className="sm:hidden px-4 space-y-8">
 <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
 <div className="flex items-center justify-between gap-3">
 <div>
 <h2 className="text-base font-semibold text-zinc-900">Fêmeas</h2>
 
 </div>
 <span className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">{females.length} filhote(s)</span>
 </div>
 {females.length === 0 ? (
 <p className="mt-3 text-sm text-zinc-500">Nenhum filhote femea com esses filtros.</p>
 ) : (
 <div className="mt-4 flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
 {females.map((p) => (
 <div key={p.id} className="min-w-[82%] snap-start">
 <PuppyCatalogCard puppy={p} />
 </div>
 ))}
 </div>
 )}
 </section>

 <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
 <div className="flex items-center justify-between gap-3">
 <div>
 <h2 className="text-xl font-semibold text-zinc-900">Machos</h2>
 
 </div>
 <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">{maleWithUnknown.length} filhote(s)</span>
 </div>
 {maleWithUnknown.length === 0 ? (
 <p className="mt-3 text-sm text-zinc-500">Nenhum filhote macho com esses filtros.</p>
 ) : (
 <div className="mt-4 flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
 {maleWithUnknown.map((p) => (
 <div key={p.id} className="min-w-[82%] snap-start">
 <PuppyCatalogCard puppy={p} />
 </div>
 ))}
 </div>
 )}
 {unknown.length > 0 ? (
 <p className="mt-3 text-xs text-zinc-500">Inclui filhotes com sexo a definir.</p>
 ) : null}
 </section>
 </div>

 {/* Desktop grid */}
 <div className="hidden sm:block mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 space-y-10">
 <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
 <div className="flex items-center justify-between gap-4">
 <div>
 <h2 className="text-lg font-semibold text-zinc-900">Fêmeas</h2>
 
 </div>
 <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700">{females.length} filhote(s)</span>
 </div>
 {females.length === 0 ? (
 <p className="mt-3 text-sm text-zinc-500">Nenhum filhote femea com esses filtros.</p>
 ) : (
 <div className="mt-4 grid grid-cols-2 gap-7 lg:grid-cols-3 xl:grid-cols-4">
 {females.map((p) => (
 <PuppyCatalogCard key={p.id} puppy={p} />
 ))}
 </div>
 )}
 </section>

 <section className="rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
 <div className="flex items-center justify-between gap-4">
 <div>
 <h2 className="text-xl font-semibold text-zinc-900">Machos</h2>
 
 </div>
 <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">{maleWithUnknown.length} filhote(s)</span>
 </div>
 {maleWithUnknown.length === 0 ? (
 <p className="mt-3 text-sm text-zinc-500">Nenhum filhote macho com esses filtros.</p>
 ) : (
 <div className="mt-4 grid grid-cols-2 gap-7 lg:grid-cols-3 xl:grid-cols-4">
 {maleWithUnknown.map((p) => (
 <PuppyCatalogCard key={p.id} puppy={p} />
 ))}
 </div>
 )}
 {unknown.length > 0 ? (
 <p className="mt-3 text-xs text-zinc-500">Inclui filhotes com sexo a definir.</p>
 ) : null}
 </section>
 </div>
 </div>
 </div>
 );
}

