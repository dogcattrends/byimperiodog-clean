
'use client';

import { useState } from "react";

import { useBlogAnalytics } from "./useBlogAnalytics";

export default function RelatoriosPage() {
  const [period] = useState("30d");
  const [author] = useState("");
  const [category] = useState("");
  const { error, isLoading } = useBlogAnalytics({
    period,
    author: author.trim() || undefined,
    category: category.trim() || undefined,
  });
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold text-[var(--text)]">Relatórios & Métricas</h1>
      {/* ...existing code... */}
      {error && <div className="text-red-600">Erro ao carregar analytics: {error.message}</div>}
      {isLoading && <div className="text-[var(--text-muted)]">Carregando métricas...</div>}
    </div>
  );
}

