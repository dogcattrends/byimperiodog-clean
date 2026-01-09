"use client";

import { AlertCircle, Dog, Loader2, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

type Recommendation = {
  puppyIdIdeal: string | null;
  top3Matches: { id: string; name: string; score: number; reason: string }[];
  reasoningText: string;
  score: number;
  upsellOpportunity: boolean;
};

export function LeadPuppyRecommenderCard({ leadId }: { leadId: string }) {
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/leads/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Erro ao recomendar");
        setRec(json.recommendation);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <section className="admin-glass-card admin-interactive space-y-3 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dog className="h-5 w-5" style={{ color: 'rgb(var(--admin-brand))' }} aria-hidden />
          <div>
            <p className="text-sm font-semibold admin-text">Recomendação de Filhote</p>
            <p className="text-xs admin-text-muted">IA recomenda o melhor match para este lead.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="admin-btn-glass inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
          IA recomendar filhote
        </button>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(var(--admin-danger),0.35)', background: 'rgba(251, 113, 133, 0.12)', color: 'rgb(255,255,255)' }}>
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </div>
      )}

      {rec ? (
        <div className="space-y-3">
          <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(var(--admin-border),0.25)', background: 'rgba(var(--admin-surface-2),0.35)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide admin-text-muted">Raciocínio</p>
            <p className="mt-1">{rec.reasoningText}</p>
            <p className="mt-1 text-xs admin-text-muted">
              Score: <span className="font-semibold admin-text">{rec.score}</span>
              {rec.upsellOpportunity && " • Oportunidade de upsell"}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold admin-text">Top 3 sugestões</p>
            <ul className="space-y-2">
              {rec.top3Matches.map((m, idx) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                  style={{ borderColor: 'rgba(var(--admin-border),0.25)', background: 'rgba(var(--admin-surface-2),0.35)' }}
                >
                  <div>
                    <p className="text-sm font-semibold admin-text">
                      #{idx + 1} {m.name}
                    </p>
                    <p className="text-xs admin-text-muted">{m.reason}</p>
                  </div>
                  <div className="text-right text-xs admin-text-muted">
                    <p className="font-semibold admin-text">{m.score} pts</p>
                    <a
                      href={`/admin/filhotes/${m.id}`}
                      className="underline-offset-2 hover:underline"
                      style={{ color: 'rgb(var(--admin-brand-bright))' }}
                    >
                      Abrir filhote
                    </a>
                  </div>
                </li>
              ))}
              {rec.top3Matches.length === 0 && (
                <li className="text-sm admin-text-muted">Nenhuma sugestão disponível.</li>
              )}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-sm admin-text-muted">Clique em “IA recomendar filhote” para gerar sugestões.</p>
      )}
    </section>
  );
}

