"use client";

import classNames from "classnames";
import Link from "next/link";

type ContentTOCItem = { title: string; href: string };

type ContentTOCProps = {
 items: ContentTOCItem[];
 className?: string;
 label?: string;
};

export function ContentTOC({ items, className, label = "Sumário" }: ContentTOCProps) {
 if (!items.length) return null;
 return (
 <nav aria-label={label} className={classNames("rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]", className)}>
 <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">{label}</p>
 <ul className="mt-2 space-y-2">
 {items.map((item) => (
 <li key={item.href}>
 <Link href={item.href} className="block text-[var(--text)] hover:text-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded">
 {item.title}
 </Link>
 </li>
 ))}
 </ul>
 </nav>
 );
}
