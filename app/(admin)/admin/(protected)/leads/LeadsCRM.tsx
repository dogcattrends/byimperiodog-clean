"use client";

import {
 ArrowLeft,
 ArrowRight,
 CalendarRange,
 Download,
 Filter,
 LayoutGrid,
 Loader2,
 MessageCircle,
 RotateCcw,
 TableProperties,
 Wand2,
 Copy,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";

import { useToast } from "@/components/ui/toast";

import type { AdminLeadsPayload, LeadListItem, LeadStatus, ParsedLeadFilters } from "./queries";
import { LEAD_STATUS_OPTIONS } from "./queries";

type Props = AdminLeadsPayload & { filters: ParsedLeadFilters };

type FilterFormState = {
 statuses: Set<LeadStatus>;
 colors: Set<string>;
 city: string;
 dateFrom: string;
 dateTo: string;
};

const STATUS_LABELS: Record<LeadStatus, string> = {
 novo: "Novo",
 em_contato: "Em contato",
 fechado: "Fechado",
 perdido: "Perdido",
};

const EMPTY_VALUE = "-";

const buildFormState = (filters: ParsedLeadFilters): FilterFormState => ({
 statuses: new Set(filters.statuses),
 colors: new Set(filters.colors),
 city: filters.city ?? "",
 dateFrom: filters.dateFrom ?? "",
 dateTo: filters.dateTo ?? "",
});

const formatDateTime = (value?: string | null) => {
 if (!value) return EMPTY_VALUE;
 const date = new Date(value);
 return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
};

const buildWhatsappMessage = (lead: LeadListItem) => {
 const firstName = (lead.name || "").split(" ")[0] ?? "";
 const desired = [lead.color, lead.preferredSex].filter((v): v is string => typeof v === "string" && v.length > 0).join(" • ");
 const puppy = lead.matchedPuppy?.name;
 return `Oi ${firstName || ""}! Somos da By Império Dog. Recebemos seu interesse${desired ? ` (${desired})` : ""}${
 puppy ? ` e já separamos o ${puppy}` : ""
 }. Podemos falar por aqui e te mandar fotos/vídeo?`;
};

const buildWhatsAppLink = (lead: LeadListItem) => {
 if (!lead.whatsapp) return null;
 return `https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(buildWhatsappMessage(lead))}`;
};

export default function LeadsCRM({ filters, items, total, page, hasNext, statusSummary, colorOptions, cityOptions }: Props) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { push } = useToast();
 const [formState, setFormState] = useState<FilterFormState>(() => buildFormState(filters));
 const [mutatingId, setMutatingId] = useState<string | null>(null);
 const [isPending, startTransition] = useTransition();

 useEffect(() => {
 setFormState(buildFormState(filters));
 }, [filters]);

 const formattedTotal = new Intl.NumberFormat("pt-BR").format(total);
 const canPrev = page > 1;
 const canNext = hasNext;

 const applyFilters = (state: FilterFormState, nextPage = 1) => {
 const params = new URLSearchParams(searchParams?.toString() ?? "");
 params.delete("status");
 params.delete("color");
 params.delete("city");
 params.delete("from");
 params.delete("to");
 params.delete("dateFrom");
 params.delete("dateTo");
 params.delete("page");

 if (state.statuses.size) params.set("status", Array.from(state.statuses).join(","));
 if (state.colors.size) params.set("color", Array.from(state.colors).join(","));
 if (state.city) params.set("city", state.city);
 if (state.dateFrom) params.set("from", state.dateFrom);
 if (state.dateTo) params.set("to", state.dateTo);
 if (nextPage > 1) params.set("page", String(nextPage));

 const url = params.toString();
 startTransition(() => {
 router.push(url ? `/admin/leads?${url}` : "/admin/leads");
 });
 };

 const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 applyFilters(formState, 1);
 };

 const handleReset = () => {
 const resetState = buildFormState({ statuses: [], colors: [], city: undefined, dateFrom: undefined, dateTo: undefined });
 setFormState(resetState);
 applyFilters(resetState, 1);
 };

 const handlePageChange = (nextPage: number) => {
 if (nextPage < 1) return;
 if (nextPage > page && !canNext) return;
 const appliedState = buildFormState(filters);
 applyFilters(appliedState, nextPage);
 };

 const handleStatusChange = async (id: string, status: LeadStatus) => {
 setMutatingId(id);
 try {
 const res = await fetch("/api/admin/leads/status", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ id, status }),
 });
 if (!res.ok) {
 const payload = await res.json().catch(() => ({}));
 throw new Error(payload?.error || "Erro ao atualizar status");
 }
 push({ type: "success", message: "Status atualizado" });
 startTransition(() => router.refresh());
 } catch (error) {
 push({ type: "error", message: error instanceof Error ? error.message : "Erro ao atualizar status" });
 } finally {
 setMutatingId(null);
 }
 };

 const handleCopyMessage = async (lead: LeadListItem) => {
 try {
 await navigator.clipboard.writeText(buildWhatsappMessage(lead));
 push({ type: "success", message: "Mensagem copiada para a área de transferência" });
 } catch {
 push({ type: "error", message: "Não foi possível copiar a mensagem" });
 }
 };

 const handleOpenWhatsApp = (lead: LeadListItem) => {
 const link = buildWhatsAppLink(lead);
 if (!link) {
 push({ type: "error", message: "Telefone sem WhatsApp válido" });
 return;
 }
 window.open(link, "_blank", "noopener,noreferrer");
 };
 const handleExportCsv = () => {
 const rows = items.map((lead) => {
 const matched = lead.matchedPuppy?.name ?? "";
 const createdAt = lead.createdAt ?? "";
 return [
 lead.id,
 lead.name || "",
 lead.phone ?? "",
 lead.whatsapp ?? "",
 lead.city ?? "",
 lead.state ?? "",
 lead.color ?? "",
 lead.status ?? "",
 createdAt,
 lead.source ?? "",
 lead.page ?? "",
 matched,
 ]
 .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
 .join(",");
 });

 const header = [
 "id",
 "name",
 "phone",
 "whatsapp",
 "city",
 "state",
 "color",
 "status",
 "created_at",
 "source",
 "page",
 "matched_puppy",
 ].join(",");

 const csv = [header, ...rows].join("\n");
 const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.href = url;
 link.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
 link.click();
 URL.revokeObjectURL(url);
 push({ type: "success", message: "CSV exportado com os leads filtrados." });
 };

 return (
 <div className="space-y-6">
 <header className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <h1 className="text-2xl font-bold admin-text">Leads</h1>
 <p className="text-sm admin-text-muted">Mini-CRM com filtros, ações rápidas e integração com filhotes.</p>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={handleExportCsv}
 className="admin-btn-glass admin-interactive inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
 >
 <Download className="h-4 w-4" aria-hidden />
 Exportar CSV
 </button>
 <div className="admin-btn-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm admin-text-muted">
 <TableProperties className="h-4 w-4" aria-hidden />
 {items.length} de {formattedTotal} leads
 </div>
 </div>
 </header>

 <section className="admin-glass-card admin-stagger-item">
 <form className="space-y-6" onSubmit={handleSubmit}>
 <div className="flex items-center gap-2 text-sm font-semibold">
 <Filter className="h-4 w-4 admin-pulse-ring" style={{ color: 'rgb(var(--admin-accent))' }} aria-hidden />
 Filtros do funil
 </div>

 <div className="admin-grid-responsive gap-4">
 <fieldset className="space-y-3 rounded-xl p-4 admin-border-glow" style={{ background: 'rgba(var(--admin-surface), 0.5)' }}>
 <legend className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--admin-text-muted))' }}>Status</legend>
 <div className="flex flex-wrap gap-2">
 {LEAD_STATUS_OPTIONS.map((status) => {
 const checked = formState.statuses.has(status);
 return (
 <label key={status} className="admin-badge admin-interactive admin-focus-ring inline-flex items-center gap-2" style={{ cursor: 'pointer' }}>
 <input
 type="checkbox"
 className="h-3 w-3 rounded admin-focus-ring"
 style={{ accentColor: 'rgb(var(--admin-brand))' }}
 checked={checked}
 onChange={(event) => {
 const next = new Set(formState.statuses);
 event.target.checked ? next.add(status) : next.delete(status);
 setFormState((prev) => ({ ...prev, statuses: next }));
 }}
 />
 {STATUS_LABELS[status]}
 </label>
 );
 })}
 </div>
 </fieldset>

 <fieldset className="space-y-3 rounded-xl p-4 admin-border-glow" style={{ background: 'rgba(var(--admin-surface), 0.5)' }}>
 <legend className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--admin-text-muted))' }}>Cor desejada</legend>
 <div className="flex flex-wrap gap-2">
 {colorOptions.map((color) => {
 const checked = formState.colors.has(color);
 return (
 <label key={color} className="admin-badge admin-interactive admin-focus-ring inline-flex items-center gap-2" style={{ cursor: 'pointer' }}>
 <input
 type="checkbox"
 className="h-3 w-3 rounded admin-focus-ring"
 style={{ accentColor: 'rgb(var(--admin-brand))' }}
 checked={checked}
 onChange={(event) => {
 const next = new Set(formState.colors);
 event.target.checked ? next.add(color) : next.delete(color);
 setFormState((prev) => ({ ...prev, colors: next }));
 }}
 />
 {color}
 </label>
 );
 })}
 {colorOptions.length === 0 && (
 <span className="text-xs" style={{ color: 'rgb(var(--admin-text-soft))' }}>
 Sem cores cadastradas ainda.
 </span>
 )}
 </div>
 </fieldset>

 <div className="space-y-2 rounded-xl p-4 admin-border-glow" style={{ background: 'rgba(var(--admin-surface), 0.5)' }}>
 <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--admin-text-muted))' }}>Cidade</p>
 <select
 value={formState.city}
 onChange={(event) => setFormState((prev) => ({ ...prev, city: event.target.value }))}
 className="admin-select w-full"
 >
 <option value="">Todas</option>
 {cityOptions.map((city) => (
 <option key={city} value={city}>
 {city}
 </option>
 ))}
 </select>
 </div>

 <div className="space-y-2 rounded-xl p-4 admin-border-glow" style={{ background: 'rgba(var(--admin-surface), 0.5)' }}>
 <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--admin-text-muted))' }}>
 <CalendarRange className="h-4 w-4" aria-hidden />
 Intervalo
 </p>
 <div className="grid grid-cols-2 gap-2">
 <input
 type="date"
 value={formState.dateFrom}
 onChange={(event) => setFormState((prev) => ({ ...prev, dateFrom: event.target.value }))}
 className="admin-input w-full"
 aria-label="Data inicial"
 />
 <input
 type="date"
 value={formState.dateTo}
 onChange={(event) => setFormState((prev) => ({ ...prev, dateTo: event.target.value }))}
 className="admin-input w-full"
 aria-label="Data final"
 />
 </div>
 <p className="text-xs" style={{ color: 'rgb(var(--admin-text-soft))' }}>Filtra por data de criação do lead.</p>
 </div>
 </div>

 <div className="flex flex-wrap items-center justify-between gap-3">
 <button
 type="button"
 onClick={handleReset}
 className="admin-btn-ghost inline-flex items-center gap-2"
 >
 <RotateCcw className="h-4 w-4" aria-hidden /> Limpar filtros
 </button>
 <button
 type="submit"
 className="admin-btn-primary inline-flex items-center gap-2"
 >
 <Filter className="h-4 w-4" aria-hidden /> Aplicar
 </button>
 </div>
 </form>

 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="list" aria-label="Resumo por status">
 {LEAD_STATUS_OPTIONS.map((status) => (
 <div key={status} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3" role="listitem">
 <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{STATUS_LABELS[status]}</p>
 <p className="text-2xl font-bold text-[var(--text)]">{statusSummary[status] ?? 0}</p>
 </div>
 ))}
 </div>

 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="space-y-1 text-sm text-[var(--text-muted)]">
 <p className="font-semibold text-[var(--text)]">Página {page}</p>
 <p>
 Mostrando {items.length} de {formattedTotal} leads.
 </p>
 </div>
 <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm">
 <button
 type="button"
 onClick={() => handlePageChange(page - 1)}
 disabled={!canPrev}
 className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold disabled:opacity-40"
 >
 <ArrowLeft className="h-4 w-4" aria-hidden /> Anterior
 </button>
 <span aria-hidden>•</span>
 <button
 type="button"
 onClick={() => handlePageChange(page + 1)}
 disabled={!canNext}
 className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold disabled:opacity-40"
 >
 Próxima <ArrowRight className="h-4 w-4" aria-hidden />
 </button>
 </div>
 </div>

 {isPending && (
 <div
 className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800"
 role="status"
 aria-live="polite"
 >
 <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Atualizando leads...
 </div>
 )}

 {items.length === 0 ? (
 <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
 <p className="text-sm font-semibold text-[var(--text)]">Nenhum lead encontrado para esses filtros.</p>
 <p className="text-xs text-[var(--text-muted)]">Tente ajustar o período ou limpar os filtros.</p>
 </div>
 ) : (
 <LeadsTable
 items={items}
 mutatingId={mutatingId}
 onStatusChange={handleStatusChange}
 onCopyMessage={handleCopyMessage}
 onOpenWhatsApp={handleOpenWhatsApp}
 />
 )}
 </section>
 </div>
 );
}

function LeadsTable({
 items,
 mutatingId,
 onStatusChange,
 onCopyMessage,
 onOpenWhatsApp,
}: {
 items: LeadListItem[];
 mutatingId: string | null;
 onStatusChange: (id: string, status: LeadStatus) => void;
 onCopyMessage: (lead: LeadListItem) => void;
 onOpenWhatsApp: (lead: LeadListItem) => void;
}) {
 return (
 <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm" aria-label="Tabela de leads">
 <table className="min-w-full divide-y divide-[var(--border)] text-sm">
 <thead className="bg-[var(--surface-2)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
 <tr>
 <th className="px-4 py-3">Lead</th>
 <th className="px-4 py-3">WhatsApp</th>
 <th className="px-4 py-3">Cidade</th>
 <th className="px-4 py-3">Cor desejada</th>
 <th className="px-4 py-3">Filhote</th>
 <th className="px-4 py-3">Status</th>
 <th className="px-4 py-3">Criado em</th>
 <th className="px-4 py-3">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border)] bg-white">
 {items.map((lead) => (
 <tr key={lead.id} className="hover:bg-[var(--surface-2)]">
 <td className="px-4 py-3 font-semibold text-[var(--text)]">
 <div className="flex flex-col">
 <a href={`/admin/leads/${lead.id}`} className="hover:underline">
 {lead.name || "Lead"}
 </a>
 <span className="text-xs text-[var(--text-muted)]">{lead.source || lead.page || EMPTY_VALUE}</span>
 </div>
 </td>
 <td className="px-4 py-3">
 <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
 <span>{lead.phone || EMPTY_VALUE}</span>
 <button
 type="button"
 onClick={() => onOpenWhatsApp(lead)}
 className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
 >
 <MessageCircle className="h-3.5 w-3.5" aria-hidden /> Abrir
 </button>
 <button
 type="button"
 onClick={() => onCopyMessage(lead)}
 className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface)]"
 >
 <Copy className="h-3.5 w-3.5" aria-hidden /> Copiar msg
 </button>
 </div>
 </td>
 <td className="px-4 py-3 text-[var(--text-muted)]">
 {[lead.city, lead.state].filter((v): v is string => typeof v === "string" && v.length > 0).join(", ") || EMPTY_VALUE}
 </td>
 <td className="px-4 py-3 text-[var(--text-muted)]">{lead.color || EMPTY_VALUE}</td>
 <td className="px-4 py-3 text-[var(--text-muted)]">
 {lead.matchedPuppy ? (
 <a
 href={`/admin/filhotes/${lead.matchedPuppy.id}`}
 className="inline-flex flex-col rounded-xl bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] hover:underline"
 >
 <span className="font-semibold">{lead.matchedPuppy.name}</span>
 <span className="text-[11px] text-[var(--text-muted)]">{lead.matchedPuppy.color || EMPTY_VALUE}</span>
 </a>
 ) : (
 <span className="text-xs text-[var(--text-muted)]">Sem filhote ainda</span>
 )}
 </td>
 <td className="px-4 py-3">
 <select
 value={lead.status}
 onChange={(event) => onStatusChange(lead.id, event.target.value as LeadStatus)}
 className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
 aria-label={`Status do lead ${lead.name}`}
 disabled={mutatingId === lead.id}
 >
 {LEAD_STATUS_OPTIONS.map((status) => (
 <option key={status} value={status}>
 {STATUS_LABELS[status]}
 </option>
 ))}
 </select>
 </td>
 <td className="px-4 py-3 text-[var(--text-muted)]">{formatDateTime(lead.createdAt)}</td>
 <td className="px-4 py-3">
 <div className="flex flex-wrap items-center gap-2">
 <a
 href={`/admin/leads/${lead.id}`}
 className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface)]"
 >
 <LayoutGrid className="h-3.5 w-3.5" aria-hidden /> Detalhes
 </a>
 <button
 type="button"
 onClick={() => onStatusChange(lead.id, "fechado")}
 disabled={mutatingId === lead.id}
 className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--text)] hover:bg-emerald-50"
 >
 <Wand2 className="h-3.5 w-3.5" aria-hidden /> Fechar
 </button>
 {mutatingId === lead.id && <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" aria-hidden />}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 );
}




