"use client";

import Link from "next/link";

type TocItem = {
  id: string;
  label: string;
  level?: number;
};

interface TOCProps {
  items: TocItem[];
  className?: string;
  title?: string;
}

export function TOC({ items, className, title = "Sumário" }: TOCProps) {
  if (!items.length) return null;

  return (
    <nav aria-label={title} className={`rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 ${className ?? ""}`}>
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm text-zinc-700">
        {items.map((item) => (
          <li key={item.id} className={item.level && item.level > 1 ? "ml-4" : undefined}>
            <Link
              href={`#${item.id}`}
              className="inline-flex min-h-[32px] items-center rounded-xl px-3 transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default TOC;

