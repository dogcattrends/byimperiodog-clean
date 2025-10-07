"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PawPrint,
  ShieldCheck,
  Coins,
  Clock3,
  ArrowUpRight,
  Trash2,
  CheckCircle2,
  TimerReset,
} from "lucide-react";

import { adminFetch } from "@/lib/adminFetch";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/dashboard/Modal";

interface PuppyRow {
  id: string;
  codigo?: string | null;
  name?: string | null;
  status?: "disponivel" | "reservado" | "vendido" | null;
  color?: string | null;
  price_cents?: number | null;
  image_url?: string | null;
  created_at?: string | null;
  descricao?: string | null;
  midia?: string[] | null;
}

type StatusFilter = "all" | "disponivel" | "reservado" | "vendido";

type SortKey = "created_desc" | "created_asc" | "price_desc" | "price_asc" | "name_asc" | "name_desc";

const STATUS_LABEL: Record<string, string> = {
  disponivel: "Disponivel",
  reservado: "Reservado",
  vendido: "Vendido",
};

function formatMoney(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function PuppiesAdminPage() {
  const router = useRouter();
  const { push } = useToast();

  const [items, setItems] = useState<PuppyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [colorFilter, setColorFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("created_desc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [pendingAction, setPendingAction] = useState<{
    type: "delete" | "status";
    puppy: PuppyRow;
    nextStatus?: "disponivel" | "reservado" | "vendido";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const response = await adminFetch("/api/admin/puppies");
        const json = await response.json();
        if (!mounted) return;
        if (!response.ok) throw new Error(json?.error || "Falha ao carregar");
        setItems(json?.items ?? []);
        setOffline(Boolean(json?.offline));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const colorOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.color) set.add(item.color);
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const min = minPrice ? parseInt(minPrice.replace(/\D/g, ""), 10) : null;
    const max = maxPrice ? parseInt(maxPrice.replace(/\D/g, ""), 10) : null;

    return items
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (colorFilter !== "all" && (item.color || "").toLowerCase() !== colorFilter.toLowerCase()) return false;
        if (normalizedSearch) {
          const haystack = `${item.codigo || ""} ${item.name || ""}`.toLowerCase();
          if (!haystack.includes(normalizedSearch)) return false;
        }
        if (min != null && (item.price_cents ?? 0) < min) return false;
        if (max != null && (item.price_cents ?? 0) > max) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sort) {
          case "created_asc":
            return (Date.parse(a.created_at || "") || 0) - (Date.parse(b.created_at || "") || 0);
          case "price_desc":
            return (b.price_cents ?? 0) - (a.price_cents ?? 0);
          case "price_asc":
            return (a.price_cents ?? 0) - (b.price_cents ?? 0);
          case "name_asc":
            return (a.name || "").localeCompare(b.name || "");
          case "name_desc":
            return (b.name || "").localeCompare(a.name || "");
          case "created_desc":
          default:
            return (Date.parse(b.created_at || "") || 0) - (Date.parse(a.created_at || "") || 0);
        }
      });
  }, [items, statusFilter, colorFilter, search, minPrice, maxPrice, sort]);

  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter((p) => p.status === "disponivel");
    const reserved = items.filter((p) => p.status === "reservado");
    const sold = items.filter((p) => p.status === "vendido");
    const sumPrice = (list: PuppyRow[]) => list.reduce((acc, p) => acc + (p.price_cents ?? 0), 0);
    return [
      {
        icon: PawPrint,
        label: "Cadastrados",
        value: total,
        hint: "Todos os filhotes no sistema",
      },
      {
        icon: ShieldCheck,
        label: "Disponiveis",
        value: available.length,
        subtitle: formatMoney(sumPrice(available)),
      },
      {
        icon: TimerReset,
        label: "Reservados",
        value: reserved.length,
        subtitle: formatMoney(sumPrice(reserved)),
      },
      {
        icon: Coins,
        label: "Vendidos",
        value: sold.length,
        subtitle: formatMoney(sumPrice(sold)),
      },
    ];
  }, [items]);

  async function updateStatus(puppy: PuppyRow, nextStatus: "disponivel" | "reservado" | "vendido") {
    setActionLoading(true);
    try {
      const response = await adminFetch("/api/admin/puppies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: puppy.id, status: nextStatus }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Falha ao atualizar status");
      setItems((prev) =>
        prev.map((item) =>
          item.id === puppy.id
            ? {
                ...item,
                status: nextStatus,
              }
            : item,
        ),
      );
      push({ type: "success", message: `Status atualizado para ${STATUS_LABEL[nextStatus]}.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      push({ type: "error", message });
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  }

  async function deletePuppy(puppy: PuppyRow) {
    setActionLoading(true);
    try {
      const response = await adminFetch(`/api/admin/puppies?id=${puppy.id}`, {
        method: "DELETE",
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Falha ao excluir");
      setItems((prev) => prev.filter((item) => item.id !== puppy.id));
      push({ type: "success", message: "Filhote removido." });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      push({ type: "error", message });
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">Filhotes</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Controle completo de estoque, status e midias dos filhotes cadastrados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            <Clock3 className="h-4 w-4" aria-hidden="true" /> Atualizar
          </button>
          <Link
            href="/admin/puppies/new"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-sm transition hover:brightness-110"
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" /> Novo cadastro
          </Link>
        </div>
      </header>

      {offline ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          Modo offline detectado. Os dados exibidos sao locais e nao serao sincronizados ate que o Supabase esteja disponivel.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, hint, subtitle }) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
                <p className="text-2xl font-semibold text-[var(--text)]">{value}</p>
              </div>
            </div>
            {subtitle ? <p className="mt-2 text-xs text-[var(--text-muted)]">{subtitle}</p> : null}
            {hint ? <p className="mt-1 text-[11px] text-[var(--text-muted)]">{hint}</p> : null}
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Status
            </legend>
            <div className="flex flex-wrap gap-2">
              {(["all", "disponivel", "reservado", "vendido"] as StatusFilter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    statusFilter === value
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface)]"
                  }`}
                  aria-pressed={statusFilter === value}
                >
                  {value === "all" ? "Todos" : STATUS_LABEL[value]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2 min-w-[220px]">
            <label htmlFor="puppy-search" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Busca
            </label>
            <input
              id="puppy-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome ou codigo"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2 min-w-[160px]">
            <label htmlFor="color-filter" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Cor
            </label>
            <select
              id="color-filter"
              value={colorFilter}
              onChange={(event) => {
                setColorFilter(event.target.value);
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
            >
              {colorOptions.map((color) => (
                <option key={color} value={color}>
                  {color === "all" ? "Todas" : color}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 min-w-[120px]">
            <label htmlFor="sort-select" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Ordenar
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
            >
              <option value="created_desc">Mais recentes</option>
              <option value="created_asc">Mais antigos</option>
              <option value="name_asc">Nome A-Z</option>
              <option value="name_desc">Nome Z-A</option>
              <option value="price_desc">Maior preco</option>
              <option value="price_asc">Menor preco</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 min-w-[130px]">
            <label htmlFor="min-price" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Preco minimo (centavos)
            </label>
            <input
              id="min-price"
              inputMode="numeric"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="ex: 500000"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2 min-w-[130px]">
            <label htmlFor="max-price" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Preco maximo (centavos)
            </label>
            <input
              id="max-price"
              inputMode="numeric"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="ex: 900000"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
          Sincronizando dados dos filhotes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-12 text-center text-sm text-[var(--text-muted)]">
          Nenhum registro corresponde aos filtros atuais.
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((puppy) => {
            const statusKey = puppy.status || "";
            return (
              <li
                key={puppy.id}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      {puppy.name || puppy.codigo || "Sem nome"}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">Codigo: {puppy.codigo || "-"}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                    {STATUS_LABEL[statusKey] || statusKey || "Sem status"}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs text-[var(--text-muted)]">
                  <div>
                    <dt className="font-medium text-[var(--text)]">Cor</dt>
                    <dd>{puppy.color || "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--text)]">Preco</dt>
                    <dd>{formatMoney(puppy.price_cents)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-medium text-[var(--text)]">Criado em</dt>
                    <dd>{formatDate(puppy.created_at)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/puppies/${puppy.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)]"
                  >
                    Detalhes
                  </Link>
                  <Link
                    href={`/admin/puppies/edit/${puppy.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-contrast)] transition hover:brightness-110"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPendingAction({ type: "status", puppy, nextStatus: "reservado" })}
                    disabled={puppy.status === "reservado"}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                  >
                    Reservar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction({ type: "status", puppy, nextStatus: "vendido" })}
                    disabled={puppy.status === "vendido"}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                  >
                    Marcar vendido
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction({ type: "delete", puppy })}
                    className="inline-flex items-center gap-2 rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={
          pendingAction?.type === "delete"
            ? "Excluir filhote"
            : pendingAction?.nextStatus === "vendido"
            ? "Confirmar venda"
            : "Atualizar status"
        }
        description={
          pendingAction?.type === "delete"
            ? "Esta acao remove permanentemente o filhote do painel."
            : pendingAction?.nextStatus === "vendido"
            ? "Confirme que o filhote foi vendido e finalize o processo."
            : "Confirme a mudanca de status."
        }
        destructive={pendingAction?.type === "delete"}
      >
        {pendingAction ? (
          <div className="space-y-4 text-sm text-[var(--text)]">
            <p>
              <strong>{pendingAction.puppy.name || pendingAction.puppy.codigo || "Filhote"}</strong>
            </p>
            {pendingAction.type === "delete" ? (
              <p>Esta acao nao pode ser desfeita.</p>
            ) : (
              <p>
                O status sera alterado para <strong>{STATUS_LABEL[pendingAction.nextStatus!]}</strong>.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2 pt-5">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!pendingAction) return;
                  if (pendingAction.type === "delete") {
                    deletePuppy(pendingAction.puppy);
                  } else if (pendingAction.nextStatus) {
                    updateStatus(pendingAction.puppy, pendingAction.nextStatus);
                  }
                }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
                  pendingAction.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
                disabled={actionLoading}
              >
                {actionLoading ? "Processando..." : "Confirmar"}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
