"use client";

/* eslint-disable import/order */
import { useEffect, useMemo, useState } from "react";

import type { Puppy } from "@/domain/puppy";

import { PuppiesBoard } from "./PuppiesBoard";
import { PuppiesTable } from "./PuppiesTable";

import type { AdminPuppyListItem, AdminPuppyStatus } from "@/lib/admin/puppies";

type Props = { items: AdminPuppyListItem[] | Puppy[] };

export function PuppiesView({ items }: Props) {
 const [view, setView] = useState<"board" | "table">("board");
 const [leadCounts, setLeadCounts] = useState<Record<string, number>>({});
 const [localItems, setLocalItems] = useState<(AdminPuppyListItem | Puppy)[]>(items as (AdminPuppyListItem | Puppy)[]);
 const slugs = useMemo(
 () =>
 Array.from(
 new Set(
 items
 .map((p) => p.slug as string | undefined)
 .filter((s): s is string => Boolean(s)),
 ),
 ),
 [items],
 );

 useEffect(() => {
 if (slugs.length === 0) return;
 const controller = new AbortController();
 fetch("/api/admin/leads/count", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ slugs }),
 signal: controller.signal,
 })
 .then((r) => r.json())
 .then((json) => {
 if (json?.counts) setLeadCounts(json.counts as Record<string, number>);
 })
 .catch(() => {});
 return () => controller.abort();
 }, [slugs]);

 const handleStatusChange = async (id: string, status: AdminPuppyStatus) => {
 await fetch("/api/admin/puppies/status", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ id, status }),
 });
 // `status` can contain values (ex: "coming_soon") that aren't in the
 // strict `Puppy['status']` union. Assert via `unknown` -> `Puppy['status']`
 // to keep runtime behavior while satisfying TypeScript here.
 setLocalItems((prev) =>
 prev.map((p) =>
 p.id === id ? { ...p, status: status as unknown as Puppy['status'] } : p
 )
 );
 };

 const toAdminItem = (p: unknown) => {
 const r = p as unknown as Record<string, unknown>;
 const createdRaw = r.createdAt ?? r.created_at;
 const createdAt =
 typeof createdRaw === 'string'
 ? createdRaw
 : createdRaw instanceof Date
 ? createdRaw.toISOString()
 : createdRaw
 ? new Date(String(createdRaw)).toISOString()
 : new Date().toISOString();

 return {
 id: String(r.id ?? ''),
 name: String(r.name ?? r.nome ?? 'Sem nome'),
 slug: r.slug ? String(r.slug) : undefined,
 status: (String(r.status ?? r.rawStatus ?? 'available') as AdminPuppyStatus),
 rawStatus: String(r.rawStatus ?? r.status ?? ''),
 color: r.color ? String(r.color) : null,
 sex: r.sex ? String(r.sex) : null,
 city: r.city ? String(r.city) : null,
 state: r.state ? String(r.state) : null,
 priceCents: Number(r.priceCents ?? r.price_cents ?? 0) || 0,
 createdAt,
 imageUrl: r.imageUrl ? String(r.imageUrl) : r.image_url ? String(r.image_url) : null,
 demandScore: r.demandScore ?? null,
 demandFlag: r.demandFlag ?? null,
 demandReason: r.demandReason ?? null,
 } as AdminPuppyListItem;
 };

 const adminItems = (localItems ?? []).map((x) => toAdminItem(x));

 return (
 <div className="space-y-4">
 <div className="flex flex-wrap items-center gap-3">
 <div className="inline-flex rounded-full border border-[var(--border)] bg-white p-1 shadow-sm" role="group" aria-label="Alternar visão">
 <button
 type="button"
 onClick={() => setView("board")}
 className={`rounded-full px-3 py-1.5 text-sm font-semibold ${view === "board" ? "bg-emerald-600 text-white" : "text-[var(--text)]"}`}
 aria-pressed={view === "board"}
 >
 Kanban de estoque
 </button>
 <button
 type="button"
 onClick={() => setView("table")}
 className={`rounded-full px-3 py-1.5 text-sm font-semibold ${view === "table" ? "bg-emerald-600 text-white" : "text-[var(--text)]"}`}
 aria-pressed={view === "table"}
 >
 Tabela
 </button>
 </div>
 <p className="text-sm text-[var(--text-muted)]">Acesso rápido: drag & drop opcional via botões; tudo com foco visível.</p>
 </div>

 {view === "board" ? (
 <PuppiesBoard items={adminItems} leadCounts={leadCounts} onStatusChange={handleStatusChange} />
 ) : (
 <PuppiesTable items={adminItems} leadCounts={leadCounts} onStatusChange={handleStatusChange} />
 )}
 </div>
 );
}
