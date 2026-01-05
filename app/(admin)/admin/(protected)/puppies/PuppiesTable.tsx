"use client";

import { Loader2, Trash, ChevronUp, ChevronDown } from "lucide-react";

import type { AdminPuppyListItem, AdminPuppyStatus, AdminPuppySort } from "@/lib/admin/puppies";
import { fixMojibake } from "@/lib/text/fixMojibake";

type Props = {
  items: AdminPuppyListItem[];
  leadCounts: Record<string, number>;
  onStatusChange: (id: string, status: AdminPuppyStatus) => Promise<void> | void;
  onDelete?: (id: string, name: string) => Promise<void> | void;
  mutatingId?: string | null;
  basePath?: string;
  sort?: AdminPuppySort;
  onRequestSort?: (next: AdminPuppySort) => void;
};

const STATUS_LABELS: Record<AdminPuppyStatus, string> = {
  available: "Disponível",
  pending: "Pendente",
  coming_soon: "Em breve",
  reserved: "Reservado",
  sold: "Vendido",
  unavailable: "Arquivado",
};

const getStatusLabel = (value: AdminPuppyStatus) => fixMojibake(STATUS_LABELS[value]) ?? STATUS_LABELS[value];

const EMPTY = "—";

export function PuppiesTable({ items, leadCounts, onStatusChange, onDelete, mutatingId, basePath = "/admin/filhotes", sort, onRequestSort }: Props) {
  const getPriceSort = () => {
    if (sort === "price-asc") return "ascending" as const;
    if (sort === "price-desc") return "descending" as const;
    return "none" as const;
  };

  const getDemandSort = () => (sort === "demand" ? "descending" : "none");

  const getRecentSort = () => (sort === "recent" ? "descending" : "none");

  const handleHeaderActivate = (column: "price" | "demand" | "recent") => {
    if (!onRequestSort) return;
    if (column === "price") {
      if (sort === "price-asc") onRequestSort("price-desc");
      else onRequestSort("price-asc");
      return;
    }
    if (column === "demand") {
      onRequestSort("demand");
      return;
    }
    onRequestSort("recent");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm" aria-label="Tabela completa de filhotes">
      <table className="min-w-full divide-y divide-[var(--border)] text-sm">
        <caption className="sr-only">Tabela com estoque de filhotes</caption>
        <thead className="bg-[var(--surface-2)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          <tr>
            <th scope="col" className="px-4 py-3">Nome</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3" aria-sort={getDemandSort()}>
              <button
                type="button"
                onClick={() => handleHeaderActivate("demand")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleHeaderActivate("demand");
                  }
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold"
                aria-label="Ordenar por score demanda"
              >
                <span>Score demanda</span>
                {getDemandSort() === "descending" ? <ChevronDown className="h-3 w-3 text-[var(--text-muted)]" aria-hidden /> : null}
              </button>
            </th>
            <th scope="col" className="px-4 py-3" aria-sort={getPriceSort()}>
              <button
                type="button"
                onClick={() => handleHeaderActivate("price")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleHeaderActivate("price");
                  }
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold"
                aria-label="Ordenar por preço"
              >
                <span>Preço</span>
                {getPriceSort() === "ascending" ? <ChevronUp className="h-3 w-3 text-[var(--text-muted)]" aria-hidden /> : null}
                {getPriceSort() === "descending" ? <ChevronDown className="h-3 w-3 text-[var(--text-muted)]" aria-hidden /> : null}
              </button>
            </th>
            <th scope="col" className="px-4 py-3">Cor / Sexo</th>
            <th scope="col" className="px-4 py-3">Cidade/UF</th>
            <th scope="col" className="px-4 py-3" aria-sort={getRecentSort()}>
              <button
                type="button"
                onClick={() => handleHeaderActivate("recent")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleHeaderActivate("recent");
                  }
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold"
                aria-label="Ordenar por data de criação"
              >
                <span>Criado em</span>
                {getRecentSort() === "descending" ? <ChevronDown className="h-3 w-3 text-[var(--text-muted)]" aria-hidden /> : null}
              </button>
            </th>
            <th scope="col" className="px-4 py-3">Leads</th>
            <th scope="col" className="px-4 py-3">A��es</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] bg-white">
          {items.map((puppy) => {
            const leads = puppy.slug ? leadCounts[puppy.slug] ?? 0 : 0;
            return (
              <tr
                key={puppy.id}
                className="hover:bg-[var(--surface-2)]"
                tabIndex={0}
                onKeyDown={(e) => {
                  // Enter on the row (when row itself is focused) opens the edit page
                  if (e.key === "Enter" && e.target === e.currentTarget) {
                    window.location.href = `${basePath}/${puppy.id}/editar`;
                  }
                }}
              >
                <td className="px-4 py-3 font-semibold text-[var(--text)]">
                  <div className="flex flex-col">
                    <a className="hover:underline" href={`${basePath}/${puppy.id}`}>
                      {puppy.name}
                    </a>
                    <span className="text-xs text-[var(--text-muted)]">{puppy.slug || EMPTY}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={puppy.status}
                    onChange={(e) => onStatusChange(puppy.id, e.target.value as AdminPuppyStatus)}
                    className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs font-semibold text-[var(--text)] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    aria-label={`Alterar status de ${puppy.name}`}
                    disabled={mutatingId === puppy.id}
                  >
                    {Object.entries(STATUS_LABELS).map(([value]) => (
                      <option key={value} value={value}>
                        {getStatusLabel(value as AdminPuppyStatus)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-[var(--text)]">
                  {puppy.demandScore != null ? (
                    <span className="inline-flex min-w-[3rem] items-center justify-center rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold">
                      {puppy.demandScore}
                    </span>
                  ) : (
                    EMPTY
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--text)]">{formatPrice(puppy.priceCents)}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {[puppy.color || EMPTY, puppy.sex ? (puppy.sex === "male" ? "Macho" : "Fêmea") : EMPTY].join(" • ")}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {[puppy.city, puppy.state].filter((v): v is string => typeof v === "string" && v.length > 0).join(", ") || EMPTY}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {puppy.createdAt ? new Date(puppy.createdAt).toLocaleDateString("pt-BR") : EMPTY}
                </td>
                <td className="px-4 py-3">
                  {puppy.slug ? (
                    <a
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                      href={`/admin/leads?puppy=${encodeURIComponent(puppy.slug)}`}
                    >
                      {leads} {leads === 1 ? "lead" : "leads"}
                    </a>
                  ) : (
                    EMPTY
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="inline-flex items-center gap-2">
                    <a href={`${basePath}/${puppy.id}/editar`} className="text-xs font-semibold text-[var(--text)] hover:underline">
                      Editar
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`Arquivar ${puppy.name}? Esta a��o pode ser revertida mudando o status.`)) return;
                        onStatusChange(puppy.id, "unavailable");
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-amber-700"
                      aria-label={`Arquivar ${puppy.name}`}
                      disabled={mutatingId === puppy.id}
                    >
                      <Trash className="h-3.5 w-3.5" aria-hidden />
                    </button>
                        <button
                          type="button"
                          onClick={() => onDelete && onDelete(puppy.id, puppy.name)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                          aria-label={'Excluir ' + puppy.name}
                          disabled={mutatingId === puppy.id}
                        >
                          <Trash className="h-3 w-3" aria-hidden />
                          Excluir
                        </button>

                    {mutatingId === puppy.id && <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" aria-hidden />}
                  </div>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                  Nenhum filhote disponível.
                </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatPrice(cents?: number | null) {
  if (!cents) return EMPTY;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}





