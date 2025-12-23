"use client";

import classNames from "classnames";
import Link from "next/link";

type RelatedLink = {
  label: string;
  href: string;
  description?: string;
};

type RelatedLinksProps = {
  links?: RelatedLink[];
  label?: string;
  className?: string;
};

export function RelatedLinks({ links = [], label = "Relacionado", className }: RelatedLinksProps) {
  if (!links.length) return null;
  return (
    <section className={classNames("rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2", className)} aria-label={label}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">{label}</p>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] hover:text-[var(--accent)]"
            >
              <span>{link.label}</span>
              <span aria-hidden>→</span>
            </Link>
            {link.description && <p className="text-xs text-[var(--text-muted)]">{link.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
