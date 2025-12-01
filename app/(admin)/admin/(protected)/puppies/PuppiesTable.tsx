"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, MoreVertical, Search } from "lucide-react";

import type { Puppy } from "@/domain/puppy";

type Props = {
  items: Puppy[];
  leadCounts: Record<string, number>;
  onStatusChange: (id: string, status: string) => Promise<void>;
};

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "available", label: "Disponível" },
  { value: "reserved", label: "Reservado" },
  { value: "sold", label: "Vendido" },
  { value: "coming_soon", label: "Em breve" },
];

const EMPTY = "—";

export function PuppiesTable({ items, leadCounts, onStatusChange }: Props) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const colors = useMemo(
    () => Array.from(new Set(items.map((p) => p.color).filter(Boolean) as string[])).sort(),
    [items],
  );
  const cities = useMemo(
    () => Array.from(new Set(items.map((p) => p.city).filter(Boolean) as string[])).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return items.filter((p) => {
      if (selectedStatus && (p as any).status !== selectedStatus) return false;
      if (selectedColor && (p.color || "") !== selectedColor) return false;
      if (selectedCity && (p.city || "") !== selectedCity) return false;
      if (query) {
        const haystack = `${p.name ?? ""} ${(p as any).slug ?? ""} ${(p.color ?? "")}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [items, selectedStatus, selectedColor, selectedCity, searchTerm]);

  useEffect(() => {
    setMutatingId(null);
  }, [items]);

  const handleStatus = (id: string, status: string) => {
    setMutatingId(id);
    startTransition(async () => {
      await onStatusChange(id, status);
      setMutatingId(null);
    });
  };

  return (
    <div className="space-y-3" aria-label="Visão tabular de filhotes">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
          <Search className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, slug ou cor"
            className="min-w-[220px] border-none bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
            aria-label="Buscar filhotes"
          />
        </label>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          aria-label="Filtrar por status"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          aria-label="Filtrar por cor"
        >
          <option value="">Cor: todas</option>
          {colors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          aria-label="Filtrar por cidade"
        >
          <option value="">Cidade: todas</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <table className="min-w-full divide-y divide-[var(--border)] text-sm">
          <caption className="sr-only">Tabela de filhotes</caption>
          <thead className="bg-[var(--surface-2)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Cor</th>
              <th className="px-4 py-3">Sexo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Cidade/UF</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3">Leads</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-white">
            {filtered.map((p) => {
              const slug = ((p as any).slug as string) || undefined;
              const leads = slug ? leadCounts[slug] ?? 0 : 0;
              return (
                <tr key={p.id} className="hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3 font-semibold text-[var(--text)]">
                    <a className="hover:underline" href={`/admin/puppies/${p.id}`}>
                      {p.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{slug || EMPTY}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{p.color || EMPTY}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{p.sex || EMPTY}</td>
                  <td className="px-4 py-3">
                    <select
                      value={(p as any).status}
                      onChange={(e) => handleStatus(p.id, e.target.value)}
                      className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs font-semibold text-[var(--text)] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      aria-label={`Status de ${p.name}`}
                      disabled={mutatingId === p.id}
                    >
                      <option value="available">Disponível</option>
                      <option value="reserved">Reservado</option>
                      <option value="sold">Vendido</option>
                      <option value="coming_soon">Em breve</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[var(--text)]">{formatPrice((p as any).priceCents)}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {[p.city, (p as any).state].filter(Boolean).join(", ") || EMPTY}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {(p as any).createdAt ? new Date((p as any).createdAt).toLocaleDateString("pt-BR") : EMPTY}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                      href={`/admin/leads?puppy=${encodeURIComponent((slug || p.id) as string)}`}
                    >
                      {leads} {leads === 1 ? "lead" : "leads"}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <a href={`/admin/puppies/edit/${p.id}`} className="text-xs font-semibold text-[var(--text)] hover:underline">
                        Editar
                      </a>
                      {mutatingId === p.id && <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" aria-hidden />}
                      <button
                        type="button"
                        aria-label={`Mais ações para ${p.name}`}
                        aria-haspopup="menu"
                        className="rounded-full p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                      >
                        <MoreVertical className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatPrice(cents?: number | null) {
  if (!cents) return EMPTY;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}
