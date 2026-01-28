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
 <div className="admin-glass-card admin-interactive overflow-hidden" aria-label="Tabela completa de filhotes">
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-[rgba(var(--admin-border),0.7)] text-sm">
 <caption className="sr-only">Tabela com estoque de filhotes</caption>
 <thead className="bg-[rgba(var(--admin-surface-2),0.35)] text-left text-[11px] uppercase tracking-wide admin-text-muted">
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
 <tbody className="divide-y divide-[rgba(var(--admin-border),0.35)]">
 {items.map((puppy) => {
 const leads = puppy.slug ? leadCounts[puppy.slug] ?? 0 : 0;
 const isMutating = mutatingId === puppy.id;
 const isArchived = puppy.status === "unavailable";
 return (
 <tr
 key={puppy.id}
 className="hover:bg-[rgba(var(--admin-surface-2),0.25)]"
 tabIndex={0}
 onKeyDown={(e) => {
 // Enter on the row (when row itself is focused) opens the edit page
 if (e.key === "Enter" && e.target === e.currentTarget) {
 window.location.href = `${basePath}/${puppy.id}/editar`;
 }
 }}
 >
 <td className="px-4 py-3 font-semibold admin-text">
 <div className="flex flex-col">
 <a className="hover:underline" href={`${basePath}/${puppy.id}`}>
 {puppy.name}
 </a>
 <span className="text-xs admin-text-muted">{puppy.slug || EMPTY}</span>
 </div>
 </td>
 <td className="px-4 py-3">
 <select
 value={puppy.status}
 onChange={(e) => onStatusChange(puppy.id, e.target.value as AdminPuppyStatus)}
 className="admin-select !min-h-0 !w-auto !px-3 !py-2 !text-xs"
 aria-label={`Alterar status de ${puppy.name}`}
 disabled={isMutating}
 >
 {Object.entries(STATUS_LABELS).map(([value]) => (
 <option key={value} value={value}>
 {getStatusLabel(value as AdminPuppyStatus)}
 </option>
 ))}
 </select>
 </td>
 <td className="px-4 py-3 admin-text">{formatPrice(puppy.priceCents)}</td>
 <td className="px-4 py-3 admin-text-muted">
 {[puppy.color || EMPTY, puppy.sex ? (puppy.sex === "male" ? "Macho" : "Fêmea") : EMPTY].join(" • ")}
 </td>
 <td className="px-4 py-3 admin-text-muted">
 {[puppy.city, puppy.state].filter((v): v is string => typeof v === "string" && v.length > 0).join(", ") || EMPTY}
 </td>
 <td className="px-4 py-3">
 {puppy.slug ? (
 <a
 className="text-xs font-semibold hover:underline"
 style={{ color: "rgb(var(--admin-brand-bright))" }}
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
 <button
 type="button"
 onClick={() => {
 window.location.href = `${basePath}/${puppy.id}/editar`;
 }}
 className="admin-btn-glass admin-focus-ring !px-3 !py-1.5 !text-xs"
 disabled={isMutating}
 >
 Editar
 </button>
 <button
 type="button"
 onClick={() => onDuplicate?.(puppy.id)}
 className="admin-btn-glass admin-focus-ring !px-3 !py-1.5 !text-xs"
 disabled={isMutating}
 >
 Duplicar
 </button>
 <button
 type="button"
 onClick={() => onStatusChange(puppy.id, "unavailable")}
 className="admin-btn-glass admin-focus-ring !px-3 !py-1.5 !text-xs"
 disabled={isMutating || isArchived}
 >
 {isArchived ? "Arquivado" : "Arquivar"}
 </button>
 {onDelete ? (
 <button
 type="button"
 onClick={() => onDelete(puppy.id, puppy.name)}
 className="inline-flex items-center gap-1 text-xs font-semibold admin-focus-ring"
 style={{ color: "rgb(var(--admin-danger))" }}
 aria-label={"Excluir " + puppy.name}
 disabled={isMutating}
 >
 <Trash className="h-3 w-3" aria-hidden />
 Excluir
 </button>
 ) : null}

 {isMutating && <Loader2 className="h-4 w-4 animate-spin admin-text-muted" aria-hidden />}
 </div>
 </td>
 </tr>
 );
 })}
 {items.length === 0 && (
 <tr>
 <td colSpan={9} className="px-4 py-6 text-center text-sm admin-text-muted">
 Nenhum filhote disponível.
 </td>
 </tr>
 )}
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





