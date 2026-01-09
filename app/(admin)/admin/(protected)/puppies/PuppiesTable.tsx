"use client";

import { Loader2, Trash } from "lucide-react";

import type { AdminPuppyListItem, AdminPuppyStatus } from "@/lib/admin/puppies";
import { fixMojibake } from "@/lib/text/fixMojibake";

type Props = {
  items: AdminPuppyListItem[];
  leadCounts: Record<string, number>;
  onStatusChange: (id: string, status: AdminPuppyStatus) => Promise<void> | void;
  onDelete?: (id: string, name: string) => Promise<void> | void;
  onDuplicate?: (id: string) => Promise<void> | void;
  mutatingId?: string | null;
  basePath?: string;
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

export function PuppiesTable({ items, leadCounts, onStatusChange, onDelete, onDuplicate, mutatingId, basePath = "/admin/filhotes" }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm" aria-label="Tabela completa de filhotes">
      <table className="min-w-full divide-y divide-[var(--border)] text-sm">
        <caption className="sr-only">Tabela com estoque de filhotes</caption>
        <thead className="bg-[var(--surface-2)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          <tr>
            <th scope="col" className="px-4 py-3">Nome</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Preço</th>
            <th scope="col" className="px-4 py-3">Cor / Sexo</th>
            <th scope="col" className="px-4 py-3">Cidade/UF</th>
            <th scope="col" className="px-4 py-3">Leads</th>
            <th scope="col" className="px-4 py-3">Ações</th>
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
                <td className="px-4 py-3 text-[var(--text)]">{formatPrice(puppy.priceCents)}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {[puppy.color || EMPTY, puppy.sex ? (puppy.sex === "male" ? "Macho" : "Fêmea") : EMPTY].join(" • ")}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {[puppy.city, puppy.state].filter((v): v is string => typeof v === "string" && v.length > 0).join(", ") || EMPTY}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`${basePath}/${puppy.id}/editar`} className="text-xs font-semibold text-[var(--text)] hover:underline">
                      Editar
                    </a>
                    <button
                      type="button"
                      onClick={() => onDuplicate?.(puppy.id)}
                      className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)]"
                      disabled={mutatingId === puppy.id}
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => onStatusChange(puppy.id, "reserved")}
                      className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                      disabled={mutatingId === puppy.id}
                    >
                      Reservar
                    </button>
                    <button
                      type="button"
                      onClick={() => onStatusChange(puppy.id, "sold")}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                      disabled={mutatingId === puppy.id}
                    >
                      Vender
                    </button>
                    <button
                      type="button"
                      onClick={() => onStatusChange(puppy.id, "unavailable")}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      disabled={mutatingId === puppy.id}
                    >
                      Ocultar
                    </button>
                    {onDelete ? (
                      <button
                        type="button"
                        onClick={() => onDelete(puppy.id, puppy.name)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                        aria-label={"Excluir " + puppy.name}
                        disabled={mutatingId === puppy.id}
                      >
                        <Trash className="h-3 w-3" aria-hidden />
                        Excluir
                      </button>
                    ) : null}

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





