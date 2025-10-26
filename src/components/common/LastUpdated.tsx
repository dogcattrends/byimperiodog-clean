"use client";

interface LastUpdatedProps {
  buildTime?: string | null;
  contentTime?: string | null;
  className?: string;
}

function normalizeIso(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatAbsolute(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

function formatRelative(iso: string) {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffHours = Math.round(diffMs / 36e5);
    if (diffHours < 1) return "atualizado agora";
    if (diffHours === 1) return "ha 1 hora";
    if (diffHours < 24) return `ha ${diffHours} horas`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return "ha 1 dia";
    if (diffDays < 7) return `ha ${diffDays} dias`;
    const diffWeeks = Math.round(diffDays / 7);
    if (diffWeeks === 1) return "ha 1 semana";
    return `ha ${diffWeeks} semanas`;
  } catch {
    return null;
  }
}

export function LastUpdated({ buildTime, contentTime, className }: LastUpdatedProps) {
  const build = normalizeIso(buildTime);
  const content = normalizeIso(contentTime);
  const best = (() => {
    if (build && content) {
      return new Date(build) > new Date(content) ? build : content;
    }
    return build ?? content ?? null;
  })();

  if (!best) return null;

  const absolute = formatAbsolute(best);
  const relative = formatRelative(best);

  return (
    <article
      className={`rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm text-emerald-900 shadow-sm ${className ?? ""}`}
      aria-live="polite"
    >
      <h3 className="text-base font-semibold text-emerald-900">Ultima atualizacao do site</h3>
      <p className="mt-1 text-emerald-700">
        {relative ?? "Conteudo atualizado recentemente."}
      </p>
      {absolute ? (
        <time className="mt-2 block text-xs uppercase tracking-[0.2em] text-emerald-600">{absolute}</time>
      ) : null}
    </article>
  );
}

export default LastUpdated;
