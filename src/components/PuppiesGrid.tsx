"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState, useCallback, useRef, useTransition } from "react";

import { supabasePublic } from "@/lib/supabasePublic";
import track from "@/lib/track";

import PuppiesFilterBar from "./PuppiesFilterBar";
import PuppyCard from "./PuppyCard";
import PuppyCardSkeleton from "./PuppyCardSkeleton";
import PuppyDetailsModal from "./PuppyDetailsModal";
import PuppyStories from "./PuppyStories";

// Tipagem permissiva, mas consolidada para reduzir o uso de any espalhado
type Puppy = {
  id: string;
  nome?: string | null; name?: string | null;
  cor?: string | null;  color?: string | null;
  gender?: string | null;
  status?: string | null;
  price_cents?: number | null; priceCents?: number | null;
  imageUrl?: string | null; image_url?: string | null; image?: string | null; imagem?: string | null;
  foto?: string | null; foto_principal?: string | null; thumb?: string | null; thumbnail?: string | null;
  capa?: string | null; cover?: string | null; main_photo?: string | null; photo?: string | null; picture?: string | null;
  midia?: unknown;
  created_at?: string | null;
};

function isVideo(u: string) {
  return /\.(mp4|webm|mov)$/i.test(u);
}

function firstImageFromMedia(m: unknown): string | undefined {
  if (!m) return;
  if (!Array.isArray(m) && typeof m === "object") {
    const o = m as Record<string, unknown>;
    const bucket = (o as Record<string, unknown>).images as unknown[]
      || (o as Record<string, unknown>).fotos as unknown[]
      || (o as Record<string, unknown>).media as unknown[]
      || (o as Record<string, unknown>).itens as unknown[]
      || (o as Record<string, unknown>).items as unknown[];
    if (Array.isArray(bucket)) m = bucket;
  }
  const tryAnyUrl = (obj: unknown): string | undefined => {
    if (!obj || typeof obj !== "object") return;
    const o = obj as Record<string, unknown>;
    const u = (o.url || o.src || o.href || o.path || o.publicUrl || o.downloadURL) as unknown;
    if (typeof u === "string" && !isVideo(u)) return u;
  };
  const arr = Array.isArray(m) ? m : [];
  for (const item of arr) {
    if (typeof item === "string") {
      if (!isVideo(item)) return item;
    } else if (item && typeof item === "object") {
      const u = tryAnyUrl(item);
      if (u) return u;
    }
  }
  return undefined;
}
const pickCover = (p: Puppy): string | undefined => (
  p.imageUrl || p.image_url || p.image || p.imagem ||
  p.cover || (p as Record<string, unknown> & { cover_url?: string }).cover_url || p.capa ||
  p.foto || p.foto_principal || p.thumb || p.thumbnail ||
  p.main_photo || p.photo || p.picture ||
  // Media ou midia em array ja normalizada pode existir apos scripts de normalizacao
  (Array.isArray((p as unknown as { media?: unknown[] }).media) && (p as unknown as { media?: unknown[] }).media?.[0] as string) ||
  firstImageFromMedia(p.midia)
);

// Normaliza string para busca removendo acentos e convertendo para minusculas
const normalize = (s: string) => s
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .toLowerCase();

export default function PuppiesGrid() {
  const [items, setItems] = useState<Puppy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryMark, setRetryMark] = useState(0); // fora re-execuo
  const [isPendingFilter, startTransition] = useTransition();
  const mountedRef = useRef(true);

  // filtros
  const [q, setQ] = useState("");
  const [gender, setGender] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [color, setColor] = useState<string>("");

  // modal de detalhes
  const [openId, setOpenId] = useState<string | null>(null);
  // stories
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const s = supabasePublic();
        const { data, error } = await s
          .from("puppies")
          .select("*")
          .order("created_at", { ascending: false });
  if (error) { throw error; }
        if (mountedRef.current) {
          setItems((data ?? []) as Puppy[]);
          track.event?.("list_loaded", { count: (data ?? []).length });
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
  }, [retryMark]);

  const retry = useCallback(()=> {
    setRetryMark(m => m+1);
  },[]);

  const availableColors = useMemo(() => {
    const set = new Set<string>();
    for (const p of items) {
      const c = (p.color || p.cor || "").trim().toLowerCase();
      if (c) set.add(c);
    }
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    // Filtragem rapida - strings ja normalizadas sob demanda
    let arr = items;
    const qTerm = q.trim();
    const wantsSearch = !!qTerm;
    const normQ = wantsSearch ? normalize(qTerm) : '';

    if (wantsSearch) {
      arr = arr.filter(p => {
        const name = normalize(p.nome || p.name || "");
        const c = normalize(p.cor || p.color || "");
        return name.includes(normQ) || c.includes(normQ);
      });
    }
    if (gender) {
      const g = gender.toLowerCase();
      arr = arr.filter(p => String(p.gender || '').toLowerCase() === g);
    }
    if (status) {
      const s = status.toLowerCase();
      arr = arr.filter(p => String(p.status || '').toLowerCase() === s);
    }
    if (color) {
      const cSel = color.toLowerCase();
      arr = arr.filter(p => String(p.cor || p.color || '').toLowerCase() === cSel);
    }
  return arr;
  }, [items, q, gender, status, color]);

  // Handlers que usam transicao para evitar travar digitacao
  const setQDeferred = useCallback((val: string) => {
    startTransition(() => setQ(val));
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

      {/* Stories launcher - mobile only */}
      {items.length > 0 && (
        <div className="mt-6 -mb-2 block sm:hidden" aria-label="Stories de filhotes">
          <div className="flex gap-3 overflow-x-auto pb-2 pl-1 pr-1 snap-x" role="list">
            {items.slice(0,12).map((p,i)=>{
              const cover = pickCover(p) || undefined;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={()=>{ setStoryIndex(i); setStoriesOpen(true); track.event?.('stories_open', { puppy_id: p.id, index: i }); }}
                  className="flex flex-col items-center gap-1 snap-start"
                  aria-label={`Abrir story de ${p.nome || p.name || 'filhote'}`}
                >
                  <span className="relative inline-block h-16 w-16 overflow-hidden rounded-full ring-2 ring-emerald-500 ring-offset-2 ring-offset-white shadow">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-[10px] text-zinc-400 bg-zinc-100">Sem</span>
                    )}
                  </span>
                  <span className="w-16 truncate text-center text-[10px] font-medium text-zinc-600">{(p.nome||p.name||'Filhote').split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy={loading || undefined} aria-live="polite">
        <AnimatePresence>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <PuppyCardSkeleton key={i} />
              ))
            : filtered.map((p) => {
        const cover = pickCover(p) || undefined;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PuppyCard p={p} cover={cover} onOpen={() => setOpenId(p.id)} />
                  </motion.div>
                );
              })}
        </AnimatePresence>
      </div>

      {/* Nenhum encontrado */}
      {!loading && filtered.length === 0 && !error && (
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Nenhum Spitz encontrado com esses filtros.
        </p>
      )}

      {/* Modal detalhes */}
      {openId && (
        <PuppyDetailsModal id={openId} onClose={() => setOpenId(null)} />
      )}

      {/* Stories fullscreen */}
      {storiesOpen && (
        <PuppyStories
          items={items.map(p=>({ id: p.id, name: p.nome || p.name, cover: pickCover(p) || null, color: p.cor || p.color, gender: p.gender }))}
          initialIndex={storyIndex}
          open={storiesOpen}
          onClose={()=> setStoriesOpen(false)}
        />
      )}
    </section>
  );
}


