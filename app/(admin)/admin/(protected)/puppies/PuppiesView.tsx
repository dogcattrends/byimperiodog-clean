"use client";

import { useEffect, useMemo, useState } from "react";

import type { Puppy } from "@/domain/puppy";

import { PuppiesBoard } from "./PuppiesBoard";
import { PuppiesTable } from "./PuppiesTable";

type Props = { items: Puppy[] };

export function PuppiesView({ items }: Props) {
  const [view, setView] = useState<"board" | "table">("board");
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({});
  const [localItems, setLocalItems] = useState<Puppy[]>(items);
  const slugs = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((p) => (p as any).slug as string | undefined)
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

  const handleStatusChange = async (id: string, status: string) => {
    await fetch("/api/admin/puppies/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setLocalItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: status as any } : p)));
  };

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
        <PuppiesBoard items={localItems} leadCounts={leadCounts} onStatusChange={handleStatusChange} />
      ) : (
        <PuppiesTable items={localItems} leadCounts={leadCounts} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}
