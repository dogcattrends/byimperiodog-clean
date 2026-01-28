
"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import track from "@/lib/track";

import type { Puppy } from "../domain/puppy";
import { listPuppiesCatalog } from "../lib/data/supabase";
import { buildWhatsAppLink } from "../lib/whatsapp";

import ErrorBoundary from "./ErrorBoundary";
import PuppiesFilterBar from "./PuppiesFilterBar";
import PuppyCard from "./PuppyCard";
import PuppyCardSkeleton from "./PuppyCardSkeleton";
import PuppyDetailsModal from "./PuppyDetailsModal";

// NormalizaÃ§Ã£o inline usada onde necessÃ¡rio; remover funÃ§Ã£o nÃ£o utilizada para evitar warning

type Props = {
 initialItems?: Puppy[];
};

export default function PuppiesGrid({ initialItems = [] }: Props) {
 const [items, setItems] = useState<Puppy[]>(initialItems);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [retryMark, setRetryMark] = useState(0);
 const [isPendingFilter, startTransition] = useTransition();
 const mountedRef = useRef(true);

 // filtros
 const [q, setQ] = useState("");
 const [gender, setGender] = useState<string>("");
 const [status, setStatus] = useState<string>("");
 const [color, setColor] = useState<string>("");

 // modal de detalhes
 const [openId, setOpenId] = useState<string | null>(null);

 useEffect(() => {
 mountedRef.current = true;
 const ac = new AbortController();
 (async () => {
 // Se jÃ¡ tem items iniciais, nÃ£o precisa buscar
 if (initialItems.length > 0) {
 setItems(initialItems);
 setLoading(false);
 return;
 }
 try {
 setLoading(true);
 setError(null);
 
 const result = await listPuppiesCatalog({}, 'recent', { limit: 40 });
 
 if (mountedRef.current) {
 setItems(result.puppies);
 track.event?.("list_loaded", { count: result.puppies.length });
 }
 } catch (e) {
 const err = e as { name?: string; message?: string };
 if (err?.name === 'AbortError') return;
 if (mountedRef.current) setError(err?.message || "Erro ao carregar filhotes.");
 } finally {
 if (mountedRef.current) setLoading(false);
 }
 })();
 return () => {
 mountedRef.current = false;
 ac.abort();
 };
 }, [retryMark, initialItems]);

 const retry = useCallback(()=> {
 setRetryMark(m => m+1);
 },[]);

 const availableColors = useMemo(() => {
 const set = new Set<string>();
 for (const p of items) {
 if (p.color) set.add(p.color);
 }
 return Array.from(set).sort();
 }, [items]);

 const filtered = useMemo(() => {
 let arr = items;
 const qTerm = q.trim();
 
 if (qTerm) {
 const normQ = qTerm.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
 arr = arr.filter(p => {
 const name = p.name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
 const desc = (p.description || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
 const color = p.color.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
 return name.includes(normQ) || desc.includes(normQ) || color.includes(normQ);
 });
 }
 
 if (gender) {
 arr = arr.filter(p => p.sex === gender);
 }
 
 if (status) {
 arr = arr.filter(p => p.status === status);
 }
 
 if (color) {
 arr = arr.filter(p => p.color.toLowerCase() === color.toLowerCase());
 }
 
 return arr;
 }, [items, q, gender, status, color]);

 const groupedBySex = useMemo(() => {
  const groups = { male: [] as Puppy[], female: [] as Puppy[], unknown: [] as Puppy[] };
  for (const p of filtered) {
   const raw = (p.sex ?? (p as any).sexo ?? (p as any).gender ?? "").toString().toLowerCase().trim();
   if (raw === "male" || raw === "macho") {
    groups.male.push(p);
   } else if (raw === "female" || raw === "femea" || raw === "fÃªmea") {
    groups.female.push(p);
   } else {
    groups.unknown.push(p);
   }
  }
  return groups;
 }, [filtered]);

 const setQDeferred = useCallback((val: string) => {
 startTransition(() => setQ(val));
 }, []);

 const clearFilters = useCallback(() => {
 setQ("");
 setGender("");
 setStatus("");
 setColor("");
 setRetryMark((m) => m + 1);
 window.scrollTo({ top: 0, behavior: "smooth" });
 }, []);

 return (
 <section id="filhotes" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
 {/* Barra de filtros */}
 <PuppiesFilterBar
 q={q}
 setQ={setQDeferred}
 gender={gender}
 setGender={setGender}
 status={status}
 setStatus={setStatus}
 color={color}
 setColor={setColor}
 showing={filtered.length}
 total={items.length}
 availableColors={availableColors}
 onReset={() => window.scrollTo({ top: 0, behavior: "smooth" })}
 />

 <div className="sr-only" role="status" aria-live="polite">
 {isPendingFilter ? 'Atualizando lista...' : `${filtered.length} de ${items.length} filhotes exibidos`}
 </div>

 {/* Mensagem de erro */}
 {error && (
 <div className="mb-6 mt-4 flex flex-col gap-3 rounded-xl bg-rose-50 px-3 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
 <p>{error}</p>
 <div className="flex gap-2">
 <button
 type="button"
 onClick={retry}
 className="rounded-md bg-rose-600 text-white px-3 py-1.5 text-xs font-medium shadow hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400"
 >Tentar novamente</button>
 <button
 type="button"
 onClick={()=>{ setError(null); setItems([]); setRetryMark(m=>m+1); }}
 className="rounded-md bg-white text-rose-600 px-3 py-1.5 text-xs font-medium shadow ring-1 ring-rose-300 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400"
 >Limpar e recarregar</button>
 </div>
 </div>
 )}

 {/* Carregando */}
 {loading && (
 <p className="py-4 text-center text-sm text-[var(--text-muted)] animate-pulse">
 Procurando os filhotes mais fofos...
 </p>
 )}

 {/* ================================================================ */}
 {/* GRID OTIMIZADO: auto-rows-fr para equalizar alturas */}
 {/* ================================================================ */}
 {loading ? (
  <div className="grid auto-rows-fr grid-cols-1 gap-6 py-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy={loading || undefined} aria-live="polite">
   {Array.from({ length: 6 }).map((_, i) => (
    <PuppyCardSkeleton key={`skeleton-${i}`} />
   ))}
  </div>
 ) : (
  <div className="space-y-10 py-6" aria-live="polite">
   <section>
    <div className="flex items-baseline justify-between gap-3">
     <h2 className="text-lg font-semibold text-zinc-900">Femeas</h2>
     <span className="text-xs font-semibold text-zinc-500">{groupedBySex.female.length} filhote(s)</span>
    </div>
    {groupedBySex.female.length === 0 ? (
     <p className="mt-3 text-sm text-zinc-500">Nenhum filhote femea com esses filtros.</p>
    ) : (
     <div className="mt-4 grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {groupedBySex.female.map((p) => {
       const cover = p.thumbnailUrl || p.images[0] || undefined;
       return (
        <div key={p.id} id={`filhote-${p.id}`} className="h-full">
         <PuppyCard p={p} cover={cover} onOpen={() => setOpenId(p.id)} />
        </div>
       );
      })}
     </div>
    )}
   </section>

   <section>
    <div className="flex items-baseline justify-between gap-3">
     <h2 className="text-lg font-semibold text-zinc-900">Machos</h2>
     <span className="text-xs font-semibold text-zinc-500">{groupedBySex.male.length + groupedBySex.unknown.length} filhote(s)</span>
    </div>
    {groupedBySex.male.length + groupedBySex.unknown.length === 0 ? (
     <p className="mt-3 text-sm text-zinc-500">Nenhum filhote macho com esses filtros.</p>
    ) : (
     <div className="mt-4 grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[...groupedBySex.male, ...groupedBySex.unknown].map((p) => {
       const cover = p.thumbnailUrl || p.images[0] || undefined;
       return (
        <div key={p.id} id={`filhote-${p.id}`} className="h-full">
         <PuppyCard p={p} cover={cover} onOpen={() => setOpenId(p.id)} />
        </div>
       );
      })}
     </div>
    )}
    {groupedBySex.unknown.length > 0 ? (
     <p className="mt-3 text-xs text-zinc-500">Inclui filhotes com sexo a definir.</p>
    ) : null}
   </section>
  </div>
 )}

 {/* Nenhum encontrado */}
 {!loading && filtered.length === 0 && !error && (
 <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
 <p className="text-sm text-[var(--text-muted)]">Nenhum Spitz encontrado com esses filtros.</p>
 <div className="flex flex-wrap justify-center gap-3">
 <button
 type="button"
 onClick={clearFilters}
 className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
 >
 Limpar filtros
 </button>
 <a
 href={buildWhatsAppLink({
 message: "OlÃ¡! NÃ£o encontrei filhotes com esses filtros. Pode me ajudar a encontrar o Spitz ideal?",
 utmSource: "site",
 utmMedium: "catalog_empty",
 utmCampaign: "filhotes",
 utmContent: "cta_whatsapp",
 })}
 target="_blank"
 rel="noreferrer"
 className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-foreground)] shadow-sm transition hover:bg-[var(--brand)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
 >
 FALAR COM A ESPECIALISTA
 </a>
 </div>
 </div>
 )}

 {openId && (
 <ErrorBoundary>
 <PuppyDetailsModal id={openId} onClose={() => setOpenId(null)} />
 </ErrorBoundary>
 )}
 </section>
 );
}








