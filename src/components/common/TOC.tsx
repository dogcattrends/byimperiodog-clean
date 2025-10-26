"use client";

import { useEffect, useMemo, useState } from "react";

type TOCItem = { id: string; text: string; level: number };

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function TOC({ containerId = "toc-container", label = "Índice" }: { containerId?: string; label?: string }) {
  const [items, setItems] = useState<TOCItem[]>([]);

  useEffect(() => {
    const root = document.getElementById(containerId);
    if (!root) return;
    const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>("h2, h3"));
    const mapped: TOCItem[] = headings.map((h) => {
      if (!h.id) {
        const id = slugify(h.textContent || "");
        if (id) h.id = id;
      }
      return { id: h.id, text: h.textContent || "", level: h.tagName === "H3" ? 3 : 2 };
    });
    setItems(mapped.filter((i) => i.id && i.text));
  }, [containerId]);

  const hasItems = items.length > 0;
  const grouped = useMemo(() => items, [items]);

  if (!hasItems) return null;

  return (
    <nav aria-label={label} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <p className="mb-2 font-semibold text-slate-700">{label}</p>
      <ul className="space-y-2">
        {grouped.map((item) => (
          <li key={item.id} className={item.level === 3 ? "ml-4" : undefined}>
            <a
              href={`#${item.id}`}
              className="focus-visible:focus-ring inline-flex rounded px-1 py-0.5 text-slate-700 underline-offset-4 hover:underline"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
