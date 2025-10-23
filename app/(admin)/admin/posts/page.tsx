"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import * as React from "react";

import { VirtualizedDataTable } from "@/components/admin/table/VirtualizedDataTable";
import { adminFetch } from "@/lib/adminFetch";
import { toCsv } from "@/lib/csv";

interface PostRow {
  id: string;
  title: string | null;
  slug: string;
  status: string;
  created_at?: string | null;
  published_at?: string | null;
}

export default function AdminPostsPage() {
  const [rows, setRows] = React.useState<PostRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<(string | number)[]>([]);

  const load = React.useCallback(async (): Promise<void> => {
    try {
      setLoading(true); setError(null);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("page", "1");
      params.set("perPage", "1000");
      const r = await adminFetch(`/api/admin/blog?${params.toString()}`, { cache: "no-store" });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || "Falha ao carregar posts");
      setRows((j?.items ?? []) as PostRow[]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [q]);

  React.useEffect(() => { const id = setTimeout(() => load(), 250); return () => clearTimeout(id); }, [load]);

  const cols = React.useMemo<ColumnDef<PostRow>[]>(() => [
    {
      header: "Título",
      accessorKey: "title",
      cell: ({ row }) => (
        <Link className="hover:underline" href={`/admin/blog/editor?id=${row.original.id}`}>
          {row.original.title || row.original.slug}
        </Link>
      ),
    },
    { header: "Status", accessorKey: "status" },
    {
      header: "Criado",
      accessorKey: "created_at",
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? new Date(v).toLocaleDateString("pt-BR") : "-";
      },
    },
    {
      header: "Publicado",
      accessorKey: "published_at",
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? new Date(v).toLocaleDateString("pt-BR") : "-";
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="text-right">
          <Link
            href={`/admin/blog/editor?id=${row.original.id}`}
            className="rounded border border-emerald-200 px-2 py-1 text-xs hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Editar
          </Link>
        </div>
      ),
      enableSorting: false,
    },
  ], []);

  const exportCsv = React.useCallback(() => {
    const rowsMap = rows.filter(r => selected.includes(r.id));
    const csv = toCsv(rowsMap, ["id", "title", "slug", "status", "created_at", "published_at"]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "posts.csv"; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  }, [rows, selected]);

  return (
    <section aria-labelledby="posts-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id="posts-title" className="text-lg font-semibold">Posts</h1>
          <p className="text-sm text-zinc-600">Tabela virtualizada com seleção em massa e export CSV.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar título… (/ abre busca)"
            className="h-10 w-[220px] rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="Buscar por título"
          />
          <button
            type="button"
            onClick={exportCsv}
            disabled={selected.length === 0}
            className="inline-flex min-h-[40px] items-center rounded-xl border border-emerald-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm hover:bg-emerald-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {error && (
        <div role="status" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">Erro: {error}</div>
      )}

      <VirtualizedDataTable<PostRow>
        columns={cols}
        data={rows}
        isLoading={loading}
        enableSelection
        onSelectionChange={setSelected}
        height={560}
        rowEstimate={48}
        className=""
      />
    </section>
  );
}
