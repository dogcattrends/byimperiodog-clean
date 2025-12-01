"use client";

/**
 * PUPPIES GRID PREMIUM v2.0
 * 
 * Grid responsivo e otimizado para catálogo de filhotes
 * - Layout mobile-first
 * - Auto-ajuste de colunas
 * - Performance otimizada
 * - Estados de loading elegantes
 * - Filtros integrados
 * - Accessibility completa
 */

import { AlertCircle, Loader2, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import type { Puppy } from "@/domain/puppy";
import { listPuppiesCatalog } from "@/lib/data/supabase";
import track from "@/lib/track";
import { buildWhatsAppLink } from "@/lib/whatsapp";

import PuppyCardPremium from "@/components/catalog/PuppyCardPremium";
import PuppyDetailsModal from "./PuppyDetailsModal";

// ============================================================================
// UTILITIES
// ============================================================================

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

// ============================================================================
// SKELETON LOADING
// ============================================================================

function PuppyCardSkeleton() {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-200" />
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-200" />
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ onReset }: { onReset: () => void }) {
  const waLink = buildWhatsAppLink({
    message: "Olá! Não encontrei filhotes com os filtros aplicados. Pode me ajudar a encontrar o Spitz ideal?",
    utmSource: "site",
    utmMedium: "catalog_empty",
    utmCampaign: "filhotes_premium",
    utmContent: "cta_whatsapp",
  });

  return (
    <div className="col-span-full flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
        <Search className="h-8 w-8 text-zinc-400" aria-hidden="true" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-zinc-900">
          Nenhum filhote encontrado
        </h3>
        <p className="text-sm text-zinc-600">
          Não encontramos filhotes com os filtros selecionados.
          <br />
          Experimente ajustar os critérios de busca.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 hover:bg-zinc-50 hover:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Limpar filtros
        </button>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Falar com especialista
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-6 rounded-2xl border border-rose-200 bg-rose-50/50 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
        <AlertCircle className="h-8 w-8 text-rose-600" aria-hidden="true" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-rose-900">
          Erro ao carregar filhotes
        </h3>
        <p className="text-sm text-rose-700">
          {message || "Ocorreu um erro inesperado. Tente novamente."}
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Tentar novamente
      </button>
    </div>
  );
}

// ============================================================================
// FILTER BAR
// ============================================================================

type FilterBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedGender: string;
  onGenderChange: (value: string) => void;
  selectedColor: string;
  onColorChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  availableColors: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
};

function FilterBar({
  searchQuery,
  onSearchChange,
  selectedGender,
  onGenderChange,
  selectedColor,
  onColorChange,
  selectedStatus,
  onStatusChange,
  availableColors,
  onClearFilters,
  hasActiveFilters,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      {/* Barra de busca principal */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, cor ou características..."
            className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-4 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            aria-label="Buscar filhotes"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
            hasActiveFilters
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline">Filtros</span>
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
              {[selectedGender, selectedColor, selectedStatus].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Painel de filtros expansível */}
      {showFilters && (
        <div
          id="filter-panel"
          className="grid gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 sm:grid-cols-3"
        >
          {/* Filtro: Sexo */}
          <div>
            <label htmlFor="filter-gender" className="mb-2 block text-xs font-semibold text-zinc-700">
              Sexo
            </label>
            <select
              id="filter-gender"
              value={selectedGender}
              onChange={(e) => onGenderChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Todos</option>
              <option value="male">Macho</option>
              <option value="female">Fêmea</option>
            </select>
          </div>

          {/* Filtro: Cor */}
          <div>
            <label htmlFor="filter-color" className="mb-2 block text-xs font-semibold text-zinc-700">
              Cor
            </label>
            <select
              id="filter-color"
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Todas as cores</option>
              {availableColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro: Status */}
          <div>
            <label htmlFor="filter-status" className="mb-2 block text-xs font-semibold text-zinc-700">
              Disponibilidade
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Todos</option>
              <option value="disponivel">Disponível</option>
              <option value="reservado">Reservado</option>
            </select>
          </div>

          {/* Botão limpar filtros */}
          {hasActiveFilters && (
            <div className="flex items-end sm:col-span-3">
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type Props = {
  initialItems?: Puppy[];
};

export default function PuppiesGridPremium({ initialItems = [] }: Props) {
  // Estado
  const [items, setItems] = useState<Puppy[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryMark, setRetryMark] = useState(0);
  const [isPendingFilter, startTransition] = useTransition();
  const mountedRef = useRef(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // Modal
  const [openId, setOpenId] = useState<string | null>(null);

  // Fetch puppies
  useEffect(() => {
    mountedRef.current = true;
    const ac = new AbortController();

    (async () => {
      if (initialItems.length > 0) {
        setItems(initialItems);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await listPuppiesCatalog({}, "recent", { limit: 40 });

        if (mountedRef.current) {
          setItems(result.puppies);
          track.event?.("list_loaded", { count: result.puppies.length, version: "premium" });
        }
      } catch (e) {
        const err = e as { name?: string; message?: string };
        if (err?.name === "AbortError") return;
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

  // Cores disponíveis
  const availableColors = useMemo(() => {
    const set = new Set<string>();
    for (const p of items) {
      if (p.color) set.add(p.color);
    }
    return Array.from(set).sort();
  }, [items]);

  // Filtrar itens
  const filtered = useMemo(() => {
    let result = items;

    // Busca por texto
    if (searchQuery.trim()) {
      const q = normalize(searchQuery);
      result = result.filter((p) => {
        const text = normalize(`${p.name} ${p.color} ${p.description || ""}`);
        return text.includes(q);
      });
    }

    // Filtro de sexo
    if (selectedGender) {
      result = result.filter((p) => p.sex === selectedGender);
    }

    // Filtro de cor
    if (selectedColor) {
      result = result.filter((p) => p.color === selectedColor);
    }

    // Filtro de status (map PT->domínio EN)
    if (selectedStatus) {
      const map: Record<string, string> = {
        disponivel: "available",
        reservado: "reserved",
        vendido: "sold",
      };
      const target = map[selectedStatus] || selectedStatus;
      result = result.filter((p) => p.status === target);
    }

    return result;
  }, [items, searchQuery, selectedGender, selectedColor, selectedStatus]);

  // Handlers
  const retry = useCallback(() => {
    setRetryMark((m) => m + 1);
  }, []);

  const clearFilters = useCallback(() => {
    startTransition(() => {
      setSearchQuery("");
      setSelectedGender("");
      setSelectedColor("");
      setSelectedStatus("");
    });
  }, []);

  const hasActiveFilters = Boolean(
    searchQuery || selectedGender || selectedColor || selectedStatus
  );

  return (
    <section className="container mx-auto px-4 py-12 sm:px-6 lg:px-8" aria-label="Catálogo de filhotes">
      {/* Cabeçalho */}
      <header className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Nossos Filhotes Disponíveis
        </h2>
        <p className="mt-3 text-lg text-zinc-600">
          Spitz Alemão Anão de criação responsável com pedigree CBKC
        </p>
      </header>

      {/* Barra de filtros */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        availableColors={availableColors}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Contador de resultados */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-zinc-600">
          {isPendingFilter ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Atualizando...
            </span>
          ) : (
            <span>
              <strong className="font-semibold text-zinc-900">{filtered.length}</strong>{" "}
              {filtered.length === 1 ? "filhote encontrado" : "filhotes encontrados"}
            </span>
          )}
        </p>
      </div>

      {/* Estado de erro */}
      {error && (
        <div className="mt-8">
          <ErrorState message={error} onRetry={retry} />
        </div>
      )}

      {/* Grid principal */}
      <div
        className="mt-6 sm:mt-8 grid auto-rows-fr grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
        aria-busy={loading || isPendingFilter}
        aria-live="polite"
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <PuppyCardSkeleton key={`skeleton-${i}`} />
            ))
          : filtered.map((puppy, index) => {
              return (
                <div key={puppy.id} id={`filhote-${puppy.id}`} role="listitem">
                  <PuppyCardPremium
                    puppy={puppy}
                    coverImage={puppy.images?.[0]}
                    onOpenDetails={() => setOpenId(puppy.id)}
                    priority={index < 4}
                  />
                </div>
              );
            })}
      </div>

      {/* Estado vazio */}
      {!loading && !error && filtered.length === 0 && (
        <div className="mt-8">
          <EmptyState onReset={clearFilters} />
        </div>
      )}

      {/* Modal de detalhes */}
      {openId && <PuppyDetailsModal id={openId} onClose={() => setOpenId(null)} />}
    </section>
  );
}
