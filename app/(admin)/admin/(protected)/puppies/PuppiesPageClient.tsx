"use client";

import { Filter, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { LoadingState, EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import type { AdminPuppyListItem, AdminPuppySort, AdminPuppyStatus, ParsedPuppyFilters } from "@/lib/admin/puppies";
import { fixMojibake } from "@/lib/text/fixMojibake";
const sanitizeText = (value: string) => fixMojibake(value) ?? value;

import { PuppiesTable } from "./PuppiesTable";

type Props = {
 items: AdminPuppyListItem[];
 leadCounts: Record<string, number>;
 filters: ParsedPuppyFilters;
 sort: AdminPuppySort;
 total: number;
 hasMore: boolean;
 statusSummary: Record<AdminPuppyStatus, number>;
 colorOptions: string[];
 cityOptions: string[];
 basePath?: string;
};

type FilterFormState = {
 statuses: Set<AdminPuppyStatus>;
 colors: Set<string>;
 city?: string;
 state?: string;
 sex?: "male" | "female";
 search: string;
 sort: AdminPuppySort;
};

const STATUS_OPTIONS: { value: AdminPuppyStatus; label: string }[] = [
 { value: "available", label: sanitizeText("Disponível") },
 { value: "coming_soon", label: sanitizeText("Em breve") },
 { value: "reserved", label: sanitizeText("Reservado") },
 { value: "sold", label: sanitizeText("Vendido") },
 { value: "unavailable", label: sanitizeText("Arquivado") },
];

const SEX_OPTIONS = [
 { value: undefined, label: sanitizeText("Ambos") },
 { value: "male" as const, label: sanitizeText("Machos") },
 { value: "female" as const, label: sanitizeText("Fêmeas") },
];

const SORT_LABELS: Record<AdminPuppySort, string> = {
 recent: sanitizeText("Mais recentes"),
 "status-available": sanitizeText("Disponíveis primeiro"),
 "status-reserved": sanitizeText("Reservados primeiro"),
};

const EMPTY_FILTERS: ParsedPuppyFilters = { statuses: [], colors: [] };

function buildFormState(filters: ParsedPuppyFilters, sort: AdminPuppySort, stateParam?: string): FilterFormState {
 return {
 statuses: new Set(filters.statuses),
 colors: new Set(filters.colors),
 city: filters.city,
 state: stateParam?.trim() ? stateParam.trim().toUpperCase() : undefined,
 sex: filters.sex,
 search: filters.search ?? "",
 sort,
 };
}

type TabId = "available" | "reserved" | "soldArchived";

type TabPreset = {
 id: TabId;
 label: string;
 helper: string;
 statuses: AdminPuppyStatus[];
};

const TAB_PRESETS: TabPreset[] = [
 {
 id: "available",
 label: sanitizeText("Disponíveis"),
 helper: sanitizeText("Estoque liberado para campanha"),
 statuses: ["available"],
 },
 {
 id: "reserved",
 label: sanitizeText("Reservados"),
 helper: sanitizeText("Confirmações aguardando contrato"),
 statuses: ["reserved"],
 },
 {
 id: "soldArchived",
 label: sanitizeText("Vendidos / Arquivados"),
 helper: sanitizeText("Histórico entregue ou inativo"),
 statuses: ["sold", "unavailable"],
 },
];

function getActiveTabId(statuses: Set<AdminPuppyStatus>): TabId | "custom" {
 const normalized = Array.from(statuses).sort();
 for (const tab of TAB_PRESETS) {
 const target = [...tab.statuses].sort();
 if (normalized.length !== target.length) continue;
 const matches = target.every((value, index) => value === normalized[index]);
 if (matches) return tab.id;
 }
 return "custom";
}

export function PuppiesPageClient({ items, leadCounts, filters, sort, total, hasMore, statusSummary, colorOptions, cityOptions, basePath = "/admin/filhotes" }: Props) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const queryState = searchParams?.get("state") ?? undefined;
 const { push } = useToast();
 const [mutatingId, setMutatingId] = useState<string | null>(null);
 const [formState, setFormState] = useState<FilterFormState>(() => buildFormState(filters, sort, queryState));
 const [isPending, startTransition] = useTransition();

 useEffect(() => {
 setFormState(buildFormState(filters, sort, queryState));
 }, [filters, sort, queryState]);

 const applyFilters = (state: FilterFormState) => {
 const params = new URLSearchParams(searchParams?.toString() ?? "");
 params.delete("status");
 params.delete("color");
 params.delete("sex");
 params.delete("city");
 params.delete("search");
 params.delete("sort");

 if (state.statuses.size) params.set("status", Array.from(state.statuses).join(","));
 if (state.colors.size) params.set("color", Array.from(state.colors).join(","));
 if (state.sex) params.set("sex", state.sex);
 if (state.city) params.set("city", state.city);
 if (state.search.trim()) params.set("search", state.search.trim());
 if (state.sort !== "recent") params.set("sort", state.sort);
 if (state.state) params.set("state", state.state);
 else params.delete("state");

 const query = params.toString();
 startTransition(() => {
 router.push(query ? `${basePath}?${query}` : basePath);
 });
 };

 const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 applyFilters(formState);
 };

 const handleReset = () => {
 setFormState(buildFormState(EMPTY_FILTERS, "recent"));
 startTransition(() => router.push(basePath));
 };

 const handleSortChange = (nextSort: AdminPuppySort) => {
 const nextState: FilterFormState = { ...formState, sort: nextSort };
 setFormState(nextState);
 applyFilters(nextState);
 };

 const toggleStatus = (status: AdminPuppyStatus) => {
 setFormState((prev) => {
 const next = new Set(prev.statuses);
 if (next.has(status)) next.delete(status);
 else next.add(status);
 return { ...prev, statuses: next };
 });
 };

 const activeTabId = useMemo(() => getActiveTabId(formState.statuses), [formState.statuses]);

 const handleTabChange = (tabId: TabId) => {
 const nextTab = TAB_PRESETS.find((tab) => tab.id === tabId);
 if (!nextTab) return;
 const nextState: FilterFormState = { ...formState, statuses: new Set(nextTab.statuses) };
 setFormState(nextState);
 applyFilters(nextState);
 };

 const toggleColor = (color: string) => {
 setFormState((prev) => {
 const next = new Set(prev.colors);
 if (next.has(color)) next.delete(color);
 else next.add(color);
 return { ...prev, colors: next };
 });
 };

 const handleStatusChange = async (id: string, status: AdminPuppyStatus) => {
 const isDestructive = status === "sold" || status === "unavailable";
 if (isDestructive && typeof window !== "undefined") {
 const confirmed = window.confirm("Tem certeza? Esta acao altera o status de forma definitiva.");
 if (!confirmed) return;
 }
 setMutatingId(id);
 try {
 const res = await fetch("/api/admin/puppies/status", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ id, status }),
 });
 if (!res.ok) {
 const payload = await res.json().catch(() => ({}));
 throw new Error(payload?.error || "Erro ao atualizar status");
 }
 push({ type: "success", message: "Status atualizado com sucesso." });
 router.refresh();
 } catch (error) {
 push({ type: "error", message: error instanceof Error ? error.message : "Erro ao atualizar status" });
 } finally {
 setMutatingId(null);
 }
 };

 const handleDelete = async (id: string, name: string) => {
 if (typeof window !== "undefined") {
 const confirmed = window.confirm("Excluir " + name + " permanentemente? Esta acao nao pode ser revertida.");
 if (!confirmed) return;
 }
 setMutatingId(id);
 try {
 const res = await fetch("/api/admin/puppies/delete", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ id }),
 });
 if (!res.ok) {
 const payload = await res.json().catch(() => ({}));
 throw new Error(payload?.error || "Erro ao excluir o filhote");
 }
 push({ type: "success", message: "Filhote excluido com sucesso." });
 router.refresh();
 } catch (error) {
 push({ type: "error", message: error instanceof Error ? error.message : "Erro ao excluir o filhote" });
 } finally {
 setMutatingId(null);
 }
 };

 const handleDuplicate = async (id: string) => {
 setMutatingId(id);
 try {
 const res = await fetch("/api/admin/puppies/duplicate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ id }),
 });
 const payload = await res.json().catch(() => ({}));
 if (!res.ok) {
 throw new Error(payload?.error || "Falha ao duplicar filhote");
 }
 const newId = payload?.id as string | undefined;
 push({ type: "success", message: "Filhote duplicado. Revise e publique." });
 if (newId) {
 router.push(`${basePath}/${newId}/editar`);
 } else {
 router.refresh();
 }
 } catch (error) {
 push({ type: "error", message: error instanceof Error ? error.message : "Erro ao duplicar filhote" });
 } finally {
 setMutatingId(null);
 }
 };

 const activeFilters = useMemo(() => {
 let count = 0;
 if (formState.statuses.size) count++;
 if (formState.colors.size) count++;
 if (formState.sex) count++;
 if (formState.city) count++;
 if (formState.search.trim()) count++;
 return count;
 }, [formState]);

 const formattedTotal = new Intl.NumberFormat("pt-BR").format(total);

 return (
 <div className="space-y-4">
 <section className="admin-glass-card admin-interactive space-y-2 p-4">
 <div className="flex items-center justify-between">
 <p className="text-sm font-semibold admin-text">Filtrar por status</p>
 <p className="text-xs admin-text-muted">Aba ativa guia o estoque principal.</p>
 </div>
 <div role="tablist" aria-label="Visões rápidas por status" className="flex flex-wrap gap-2">
 {TAB_PRESETS.map((tab) => {
 const count = tab.statuses.reduce((acc, status) => acc + (statusSummary[status] ?? 0), 0);
 const isActive = activeTabId === tab.id;
 return (
 <button
 key={tab.id}
 type="button"
 role="tab"
 aria-selected={isActive}
 onClick={() => handleTabChange(tab.id)}
 className={`flex flex-col gap-1 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
 isActive
 ? "admin-btn-primary"
 : "admin-btn-glass admin-interactive"
 } focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500`}
 >
 <span>{tab.label}</span>
 <span className="text-xs font-normal text-[color:inherit]">{tab.helper}</span>
 <span className="text-xs font-normal text-[var(--text-muted)]" aria-live="polite">
 {count} filhote{count === 1 ? "" : "s"}
 </span>
 </button>
 );
 })}
 </div>
 </section>

 <form
 onSubmit={handleSubmit}
 className="admin-glass-card admin-interactive space-y-4 p-4"
 aria-labelledby="filters-heading"
 >
 <div className="flex items-center gap-2">
 <SlidersHorizontal className="h-4 w-4 admin-text-muted" aria-hidden />
 <h2 id="filters-heading" className="text-sm font-semibold admin-text">
 Filtros avançados {activeFilters ? `(${activeFilters})` : ""}
 </h2>
 </div>

 <div className="grid gap-4 lg:grid-cols-4">
 <fieldset className="space-y-2">
 <legend className="text-xs font-semibold uppercase tracking-wide admin-text-muted">Status</legend>
 <div className="grid gap-2">
 {STATUS_OPTIONS.map((option) => {
 const id = `status-${option.value}`;
 return (
 <label key={option.value} htmlFor={id} className="inline-flex items-center gap-2 text-sm admin-text">
 <input
 id={id}
 type="checkbox"
 checked={formState.statuses.has(option.value)}
 onChange={() => toggleStatus(option.value)}
 className="h-4 w-4 rounded border-none bg-[rgba(var(--admin-surface-2),0.8)] text-emerald-500 focus:ring-emerald-500"
 />
 {option.label}
 </label>
 );
 })}
 </div>
 </fieldset>

 <fieldset className="space-y-2">
 <legend className="text-xs font-semibold uppercase tracking-wide admin-text-muted">Cor</legend>
 <div className="grid gap-2">
 {colorOptions.length === 0 && <p className="text-xs admin-text-muted">Sem cores cadastradas.</p>}
 {colorOptions.map((color) => {
 const id = `color-${color}`;
 return (
 <label key={color} htmlFor={id} className="inline-flex items-center gap-2 text-sm admin-text capitalize">
 <input
 id={id}
 type="checkbox"
 checked={formState.colors.has(color)}
 onChange={() => toggleColor(color)}
 className="h-4 w-4 rounded border-none bg-[rgba(var(--admin-surface-2),0.8)] text-emerald-500 focus:ring-emerald-500"
 />
 {color.replace(/-/g, " ")}
 </label>
 );
 })}
 </div>
 </fieldset>

 <div className="space-y-3">
 <div className="space-y-2">
 <p className="text-xs font-semibold uppercase tracking-wide admin-text-muted">Sexo</p>
 <div className="flex flex-wrap gap-2">
 {SEX_OPTIONS.map((option) => (
 <button
 key={option.label}
 type="button"
 onClick={() => setFormState((prev) => ({ ...prev, sex: option.value }))}
 className={`rounded-full px-3 py-1 text-xs font-semibold admin-interactive ${formState.sex === option.value ? "admin-btn-primary" : "admin-btn-glass"}`}
 aria-pressed={formState.sex === option.value}
 >
 {option.label}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-1">
 <label className="text-xs font-semibold uppercase tracking-wide admin-text-muted" htmlFor="city-filter">
 Cidade
 </label>
 <select
 id="city-filter"
 className="admin-select w-full"
 value={formState.city ?? ""}
 onChange={(e) => setFormState((prev) => ({ ...prev, city: e.target.value || undefined }))}
 >
 <option value="">Todas</option>
 {cityOptions.map((city) => (
 <option key={city} value={city}>
 {city}
 </option>
 ))}
 </select>
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-xs font-semibold uppercase tracking-wide admin-text-muted" htmlFor="search-term">
 Buscar por nome, slug ou cidade
 </label>
 <input
 id="search-term"
 type="search"
 value={formState.search}
 onChange={(e) => setFormState((prev) => ({ ...prev, search: e.target.value }))}
 className="admin-input w-full"
 placeholder="Digite para filtrar"
 />
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
 <Filter className="h-4 w-4" aria-hidden /> Aplicar filtros
 </button>
 </div>
 </form>

 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="space-y-1">
 <p className="text-sm font-semibold admin-text" role="status" aria-live="polite">
 {formattedTotal} filhote(s) encontrados {hasMore ? "(há mais registros, refine a busca)" : ""}
 </p>
 <p className="text-xs admin-text-muted">Visão focada em estoque real, filtros aplicados via Supabase.</p>
 </div>
 <div className="flex flex-wrap items-center gap-3">
 <label className="text-sm admin-text">
 Ordenar por
 <select
 value={formState.sort}
 onChange={(e) => handleSortChange(e.target.value as AdminPuppySort)}
 className="admin-select ml-2"
 >
 {Object.entries(SORT_LABELS).map(([value, label]) => (
 <option key={value} value={value}>
 {label}
 </option>
 ))}
 </select>
 </label>
 </div>
 </div>

 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" role="list" aria-label="Resumo por status">
 {STATUS_OPTIONS.map((option) => (
 <div key={option.value} className="admin-glass-card admin-interactive px-3 py-2 text-sm" role="listitem">
 <p className="font-semibold admin-text">{option.label}</p>
 <p className="admin-kpi-value text-xl font-bold">{statusSummary[option.value] ?? 0}</p>
 </div>
 ))}
 </div>

 {isPending && <LoadingState message="Atualizando dados..." />}

 {items.length === 0 ? (
 <EmptyState title="Nenhum filhote encontrado" description="Ajuste os filtros ou limpe para visualizar todo o estoque." actionLabel="Limpar filtros" onAction={handleReset} />
 ) : (
 <PuppiesTable
 items={items}
 leadCounts={leadCounts}
 onStatusChange={handleStatusChange}
 onDelete={handleDelete}
 onDuplicate={handleDuplicate}
 mutatingId={mutatingId}
 basePath={basePath}
 />
 )}
 </div>
 );
}
















