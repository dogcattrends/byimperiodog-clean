"use client";

import { Loader2 } from "lucide-react";
import React from "react";

export function LoadingState({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-6 text-sm text-[var(--text-muted)]" role="status" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, onAction }: { title?: string; description?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
      <p className="text-sm font-semibold text-[var(--text)]">{title ?? "Nada encontrado."}</p>
      {description && <p className="mt-2 text-xs text-[var(--text-muted)]">{description}</p>}
      {actionLabel && onAction && (
        <div className="mt-4">
          <button onClick={onAction} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)]">
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default LoadingState;
