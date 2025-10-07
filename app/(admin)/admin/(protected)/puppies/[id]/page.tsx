"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, PawPrint } from "lucide-react";

import { adminFetch } from "@/lib/adminFetch";
import { useToast } from "@/components/ui/toast";
import { normalizePuppy, type PuppyDTO, type RawPuppy } from "@/types/puppy";

const STATUS_LABEL: Record<string, string> = {
  disponivel: "Disponivel",
  reservado: "Reservado",
  vendido: "Vendido",
};

function formatMoney(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function PuppyDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { push } = useToast();

  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<PuppyDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idParam) return;
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const response = await adminFetch("/api/admin/puppies");
        const json = await response.json();
        if (!mounted) return;
        if (!response.ok) throw new Error(json?.error || "Falha ao carregar filhote");
        const found = (json?.items as RawPuppy[] | undefined)?.find((item) => item.id === idParam);
        if (!found) {
          setError("Filhote nao encontrado.");
        } else {
          setRecord(normalizePuppy(found));
        }
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
  }, [idParam]);

  return (
    <div className="space-y-6 px-6 py-8">
      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
        <Link
          href="/admin/puppies"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 transition hover:bg-[var(--surface-2)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para listagem
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden />
          <span className="mt-2 block">Carregando informacoes...</span>
        </div>
      ) : error ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-6 text-sm text-red-600" role="alert">
            {error}
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin/puppies")}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            Voltar para lista
          </button>
        </div>
      ) : record ? (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold text-[var(--text)]">{record.nome}</h1>
                <p className="text-sm text-[var(--text-muted)]">Codigo: {record.codigo || "-"}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                <PawPrint className="h-4 w-4" aria-hidden /> {STATUS_LABEL[record.status] || record.status}
              </span>
            </header>

            <dl className="grid gap-3 text-sm text-[var(--text-muted)] md:grid-cols-2">
              <div>
                <dt className="font-semibold text-[var(--text)]">Sexo</dt>
                <dd>{record.gender === "female" ? "Femea" : "Macho"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--text)]">Cor</dt>
                <dd>{record.color || "-"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--text)]">Preco</dt>
                <dd>{formatMoney(record.price_cents)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--text)]">Nascimento</dt>
                <dd>{formatDate(record.nascimento)}</dd>
              </div>
            </dl>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-[var(--text)]">Descricao publica</h2>
              <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)]">
                {record.descricao || "Sem descricao cadastrada."}
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-[var(--text)]">Notas internas</h2>
              <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)]">
                {record.notes || "Sem notas."}
              </p>
            </div>
          </section>

          <aside className="space-y-4">
            {record.image_url ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <img
                  src={record.image_url}
                  alt={`Capa do filhote ${record.nome}`}
                  className="h-56 w-full object-cover"
                />
              </div>
            ) : null}

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[var(--text)]">Midias</h2>
              {record.midia.length === 0 ? (
                <p className="mt-3 text-xs text-[var(--text-muted)]">Nenhuma imagem vinculada.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-xs">
                  {record.midia.map((url) => (
                    <li key={url} className="truncate">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] underline"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              href={`/admin/puppies/edit/${record.id}`}
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-sm transition hover:brightness-110 w-full"
            >
              Editar filhote
            </Link>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
