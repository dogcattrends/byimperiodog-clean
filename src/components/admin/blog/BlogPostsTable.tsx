/** BlogPostsTable.tsx: Tabela virtualizada com filtros/paginacao, bulk actions e import/export CSV. */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";

import { toCsv } from "@/lib/csv";
import { blogRepo } from "@/lib/db";
import type { ListResult, Post, PostStatus } from "@/lib/db/types";

type BulkAction = "publish" | "unpublish" | "delete";

interface BlogPostsTableProps {
  initialData: ListResult<Post>;
  onImportCsv?: (file: File) => Promise<void>;
  onBulkAction?: (action: BulkAction, ids: string[]) => Promise<void>;
}

interface TableState {
  search: string;
  status: "all" | PostStatus;
  page: number;
  perPage: number;
}

export default function BlogPostsTable({ initialData, onImportCsv, onBulkAction }: BlogPostsTableProps) {
  const [rows, setRows] = useState<Post[]>(initialData.items);
  const [total, setTotal] = useState(initialData.total);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [state, setState] = useState<TableState>({ search: "", status: "all", page: 1, perPage: 25 });

  const parentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let abort = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const { items, total: nextTotal } = await blogRepo.listPosts({
          search: state.search,
          status: state.status === "all" ? undefined : state.status,
          limit: state.perPage,
          offset: (state.page - 1) * state.perPage,
        });
        if (abort) return;
        setRows(items);
        setTotal(nextTotal);
      } catch (err) {
        if (!abort) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!abort) setIsLoading(false);
      }
    }
    void load();
    return () => {
      abort = true;
    };
  }, [state]);

  const columns = useMemo<ColumnDef<Post>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <input
            type="checkbox"
            aria-label="Selecionar todos"
            checked={selectedIds.size > 0 && selectedIds.size === rows.length}
            onChange={(event) => {
              const next = new Set<string>();
              if (event.target.checked) rows.forEach((row) => next.add(row.id));
              setSelectedIds(next);
            }}
            className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Selecionar ${row.original.slug}`}
            checked={selectedIds.has(row.original.id)}
            onChange={(event) => {
              const next = new Set(selectedIds);
              if (event.target.checked) next.add(row.original.id);
              else next.delete(row.original.id);
              setSelectedIds(next);
            }}
            className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          />
        ),
      },
      { accessorKey: "title", header: "Titulo" },
      { accessorKey: "slug", header: "Slug" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = String(getValue());
          const variants: Record<string, string> = {
            draft: "bg-zinc-100 text-zinc-700",
            scheduled: "bg-amber-100 text-amber-700",
            published: "bg-emerald-100 text-emerald-700",
            archived: "bg-slate-200 text-slate-600",
          };
          return (
            <span className={`inline-flex min-h-[24px] items-center rounded-full px-2 text-xs font-semibold ${variants[status] ?? "bg-zinc-100 text-zinc-600"}`}>
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "publishedAt",
        header: "Publicação",
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value) return "—";
          try {
            return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(String(value)));
          } catch {
            return "—";
          }
        },
      },
    ],
    [rows, selectedIds],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  async function handleBulk(action: BulkAction) {
    if (!onBulkAction || selectedIds.size === 0) return;
    await onBulkAction(action, Array.from(selectedIds));
    setSelectedIds(new Set());
  }

  async function handleExportCsv() {
    const csv = toCsv(rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title ?? "",
      status: row.status,
      published_at: row.publishedAt ?? "",
      scheduled_at: row.scheduledAt ?? "",
    })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "posts.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function handleImportCsv(event: React.ChangeEvent<HTMLInputElement>) {
    if (!onImportCsv) return;
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    void onImportCsv(file).finally(() => {
      event.target.value = "";
      setState((prev) => ({ ...prev }));
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / state.perPage));

  return (
    <section className="space-y-4" aria-labelledby="blog-table-title">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="blog-table-title" className="text-lg font-semibold">Posts do blog</h2>
          <p className="text-sm text-zinc-600">Tabela virtualizada com filtros, selecao em massa e exportacao CSV.</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={state.search}
            onChange={(event) => setState((prev) => ({ ...prev, search: event.target.value, page: 1 }))}
            placeholder="Buscar por titulo ou slug"
            className="h-10 w-64 rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="Buscar posts"
          />
          <select
            value={state.status}
            onChange={(event) => setState((prev) => ({ ...prev, status: event.target.value as "all" | PostStatus, page: 1 }))}
            className="h-10 rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="Filtrar por status"
          >
            <option value="all">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="scheduled">Agendado</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
          <button
            type="button"
            onClick={() => handleBulk("publish")}
            disabled={!onBulkAction || selectedIds.size === 0}
            className="min-h-[40px] rounded-xl border border-emerald-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-emerald-50 disabled:opacity-50"
          >
            Publicar selecionados
          </button>
          <button
            type="button"
            onClick={() => handleBulk("unpublish")}
            disabled={!onBulkAction || selectedIds.size === 0}
            className="min-h-[40px] rounded-xl border border-amber-200 bg-white px-3 text-sm font-medium text-amber-700 shadow-sm transition hover:bg-amber-50 disabled:opacity-50"
          >
            Reverter para rascunho
          </button>
          <button
            type="button"
            onClick={() => handleBulk("delete")}
            disabled={!onBulkAction || selectedIds.size === 0}
            className="min-h-[40px] rounded-xl border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
          >
            Excluir
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="min-h-[40px] rounded-xl border border-emerald-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-emerald-50"
            >
              Exportar CSV
            </button>
            {onImportCsv ? (
              <label className="inline-flex min-h-[40px] cursor-pointer items-center rounded-xl border border-emerald-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-emerald-50">
                Importar CSV
                <input type="file" accept=".csv" className="sr-only" onChange={handleImportCsv} />
              </label>
            ) : null}
          </div>
        </div>
      </header>

      {error ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Falha ao carregar posts: {error}
        </div>
      ) : null}

      <div ref={parentRef} className="relative max-h-[70vh] overflow-auto rounded-2xl border border-emerald-100" role="grid" aria-busy={isLoading}>
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const post = rows[virtualRow.index];
            const offset = virtualRow.start;
            const size = virtualRow.size;
            return (
              <div
                key={post.id}
                role="row"
                className="absolute inset-x-0 grid grid-cols-[48px,1.2fr,0.8fr,0.8fr,0.6fr] items-center gap-3 border-b border-emerald-50 bg-white px-4 py-3 text-sm text-zinc-800"
                style={{ transform: `translateY(${offset}px)`, height: size }}
              >
                {columns.map((column) => {
                  if (column.id === "select") {
                    const checked = selectedIds.has(post.id);
                    return (
                      <div key={column.id} role="gridcell">
                        <input
                          type="checkbox"
                          aria-label={`Selecionar ${post.slug}`}
                          checked={checked}
                          onChange={(event) => {
                            const next = new Set(selectedIds);
                            if (event.target.checked) next.add(post.id);
                            else next.delete(post.id);
                            setSelectedIds(next);
                          }}
                          className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        />
                      </div>
                    );
                  }
                  const key = ("accessorKey" in column ? (column as any).accessorKey : undefined) as keyof Post | undefined;
                  let content: React.ReactNode = "—";
                  if (key === "status") {
                    const status = post.status;
                    const variants: Record<PostStatus | string, string> = {
                      draft: "bg-zinc-100 text-zinc-700",
                      scheduled: "bg-amber-100 text-amber-700",
                      published: "bg-emerald-100 text-emerald-700",
                      archived: "bg-slate-200 text-slate-600",
                    };
                    content = (
                      <span className={`inline-flex min-h-[24px] items-center rounded-full px-2 text-xs font-semibold ${variants[status] ?? "bg-zinc-100 text-zinc-600"}`}>
                        {status}
                      </span>
                    );
                  } else if (key === "publishedAt") {
                    const value = post.publishedAt;
                    if (!value) content = "—";
                    else {
                      try {
                        content = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(String(value)));
                      } catch {
                        content = "—";
                      }
                    }
                  } else if (key) {
                    // Fallback render for simple fields
                    content = ((post as unknown) as Record<string, unknown>)[key] as React.ReactNode ?? "—";
                  }
                  return (
                    <div key={String(key)} role="gridcell" className="truncate">
                      {content}
                    </div>
                  );
                })}
                <div role="gridcell" className="text-right">
                  <a
                    href={`/admin/blog/editor?id=${post.id}`}
                    className="inline-flex min-h-[34px] items-center rounded-xl border border-emerald-200 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                  >
                    Editar
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600">
        <div>
          {rows.length} de {total} posts
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={state.page === 1}
            className="h-12 min-w-12 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Página anterior"
          >
            Anterior
          </button>
          <span>
            Página {state.page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
            disabled={state.page >= totalPages}
            className="h-12 min-w-12 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Próxima página"
          >
            Próxima
          </button>
        </div>
      </footer>
    </section>
  );
}
