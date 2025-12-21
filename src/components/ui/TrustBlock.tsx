"use client";

import classNames from "classnames";
import type { ReactNode } from "react";

type TrustBlockProps = {
  title: string;
  description: string;
  items: { label: string; value: string; meta?: string }[];
  className?: string;
};

export function TrustBlock({ title, description, items, className }: TrustBlockProps) {
  return (
    <section
      aria-label={title}
      className={classNames("rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-3", className)}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">{title}</p>
        <p className="text-sm text-[var(--text)]">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <article key={item.label} className="rounded-xl bg-[var(--surface-2)] p-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">{item.label}</p>
            <p className="text-lg font-semibold text-[var(--text)]">{item.value}</p>
            {item.meta && <p className="text-[11px] text-[var(--text-muted)]">{item.meta}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
