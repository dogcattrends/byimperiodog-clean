"use client";

import { ArrowLeft, Edit3, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminFetch";
import type { RawPuppy } from "@/types/puppy";

const EMPTY = "--";

export default function FilhoteDetailPage() {
 const params = useParams<{ id: string }>();
 const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
 const [loading, setLoading] = useState(true);
 const [record, setRecord] = useState<RawPuppy | null>(null);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 if (!idParam) return;
 let mounted = true;
 async function load() {
 try {
 setLoading(true);
 const response = await adminFetch(`/api/admin/puppies?id=${idParam}`);
 const json = await response.json();
 if (!mounted) return;
 if (!response.ok) throw new Error(json?.error || "Falha ao carregar filhote");
 setRecord((json?.puppy as RawPuppy) ?? null);
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 setRecord(null);
 } finally {
 if (mounted) setLoading(false);
 }
 }
 load();
 return () => {
 mounted = false;
 };
 }, [idParam]);

 return (
 <div className="space-y-6 px-6 py-8">
 <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-muted)]">
 <Link
 href="/admin/filhotes"
 className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 transition hover:bg-[var(--surface-2)]"
 >
 <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar para listagem
 </Link>
 {idParam ? (
 <Link
 href={`/admin/filhotes/${encodeURIComponent(idParam)}/editar`}
 className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm hover:bg-emerald-700"
 >
 <Edit3 className="h-4 w-4" aria-hidden />
 Editar
 </Link>
 ) : null}
 </div>

 <header className="space-y-2">
 <h1 className="text-2xl font-bold text-[var(--text)]">Detalhes do filhote</h1>
 <p className="text-sm text-[var(--text-muted)]">Resumo operacional para venda consultiva.</p>
 </header>

 {loading ? (
 <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-sm text-[var(--text-muted)]">
 <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
 Carregando dados do filhote...
 </div>
 ) : error ? (
 <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700" role="alert">
 {error}
 </div>
 ) : record ? (
 <div className="grid gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm md:grid-cols-2">
 <div className="space-y-2">
 <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Identificacao</p>
 <p className="text-sm text-[var(--text)]">
 <strong>Nome:</strong> {record.name ?? record.nome ?? EMPTY}
 </p>
 <p className="text-sm text-[var(--text)]">
 <strong>Slug:</strong> {record.slug ?? EMPTY}
 </p>
 <p className="text-sm text-[var(--text)]">
 <strong>Status:</strong> {record.status ?? EMPTY}
 </p>
 </div>
 <div className="space-y-2">
 <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Comercial</p>
 <p className="text-sm text-[var(--text)]">
 <strong>Preco:</strong> {formatPrice(record.price_cents ?? null)}
 </p>
 <p className="text-sm text-[var(--text)]">
 <strong>Cor / Sexo:</strong>{" "}
 {[record.color ?? EMPTY, record.sex ? (record.sex === "male" ? "Macho" : "Femea") : EMPTY].join(" / ")}
 </p>
 <p className="text-sm text-[var(--text)]">
 <strong>Cidade/UF:</strong> {[record.city, record.state].filter(Boolean).join(" / ") || EMPTY}
 </p>
 </div>
 <div className="space-y-2 md:col-span-2">
 <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Cadastro</p>
 <p className="text-sm text-[var(--text)]">
 <strong>Atualizado em:</strong> {formatDate(record.updated_at ?? record.updatedAt ?? null)}
 </p>
 <p className="text-sm text-[var(--text)]">
 <strong>Criado em:</strong> {formatDate(record.created_at ?? record.createdAt ?? null)}
 </p>
 </div>
 </div>
 ) : (
 <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-sm text-[var(--text-muted)]">
 Filhote nao encontrado.
 </div>
 )}
 </div>
 );
}

function formatPrice(cents?: number | string | null) {
 const value = typeof cents === "string" ? Number(cents) : cents;
 if (!value || !Number.isFinite(value)) return EMPTY;
 return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value / 100);
}

function formatDate(value?: string | null) {
 if (!value) return EMPTY;
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return EMPTY;
 return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}
