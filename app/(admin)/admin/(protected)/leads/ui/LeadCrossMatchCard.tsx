"use client";

import { ArrowRight, Loader2, Shuffle } from "lucide-react";
import { useState, useTransition } from "react";

type Suggestion = {
  suggestion_type: "match" | "upsell" | "fallback";
  puppyId: string | null;
  puppyName?: string | null;
  reasoning: string;
  probability_of_acceptance: number;
  alternatives: { id: string; name: string | null; score: number }[];
};

const badgeVariant: Record<Suggestion["suggestion_type"], string> = {
  match: "admin-badge-success",
  upsell: "admin-badge-warning",
  fallback: "admin-badge-info",
};

export function LeadCrossMatchCard({ leadId }: { leadId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Suggestion | null>(null);

  const run = () => {
    setError(null);
    start(async () => {
      try {
        const res = await fetch("/api/admin/leads/crossmatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Erro ao cruzar preferências");
        setData(json.suggestion);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <section className="admin-glass-card admin-interactive space-y-3 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shuffle className="h-4 w-4" style={{ color: 'rgb(var(--admin-brand))' }} aria-hidden />
          <div>
            <p className="text-sm font-semibold admin-text">CrossMatch AI</p>
            <p className="text-xs admin-text-muted">Cruza preferências do lead com estoque real.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="admin-btn-glass inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Rodar
        </button>
      </header>

      {error && <p className="text-sm" style={{ color: 'rgb(var(--admin-danger))' }}>{error}</p>}

      {!data && !pending && <p className="text-sm admin-text-muted">Clique em “Rodar” para gerar sugestão.</p>}

      {data && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`admin-badge ${badgeVariant[data.suggestion_type]}`}>
              {data.suggestion_type === "match" && "Match"}
              {data.suggestion_type === "upsell" && "Upsell"}
              {data.suggestion_type === "fallback" && "Fallback"}
            </span>
            <span className="text-xs admin-text-muted">{data.probability_of_acceptance}% aceitação</span>
          </div>
          <p className="text-sm font-semibold admin-text">
            {data.puppyName || data.puppyId || "Melhor opção disponível"}
          </p>
          <p className="text-sm admin-text-muted">{data.reasoning}</p>
          {data.alternatives.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold admin-text">Alternativas</p>
              <ul className="space-y-1">
                {data.alternatives.map((alt) => (
                  <li key={alt.id} className="flex items-center justify-between text-sm admin-text">
                    <span className="line-clamp-1">{alt.name || alt.id}</span>
                    <span className="flex items-center gap-1 text-xs admin-text-muted">
                      {alt.score}
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
