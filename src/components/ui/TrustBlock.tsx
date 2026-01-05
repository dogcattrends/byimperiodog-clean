"use client";

import classNames from "classnames";

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
      className={classNames(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-3 animate-fade-in-up",
        className
      )}
      style={{ animationDelay: "0.2s", animationFillMode: "both" }}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">{title}</p>
        <p className="text-sm text-[var(--text)]">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-3 lg:flex lg:items-stretch lg:space-x-4">
        {items.map((item, idx) => (
          <article
            key={item.label}
            className={classNames(
              "rounded-xl bg-[var(--surface-2)] p-3 animate-fade-in-up flex flex-col justify-center gap-1 min-h-[64px]",
              "lg:flex-1 lg:p-6 lg:min-h-[96px]"
            )}
            style={{ animationDelay: `${0.3 + idx * 0.1}s`, animationFillMode: "both" }}
          >
            <p className="text-xs uppercase text-[var(--text-muted)] tracking-[0.06em] sm:tracking-[0.3em] leading-tight break-words">{item.label}</p>
            <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-[var(--text)] leading-tight">{item.value}</p>
            {item.meta && <p className="text-[12px] text-[var(--text-muted)] mt-1">{item.meta}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

export default TrustBlock;
