"use client";

import { useCallback, useEffect, useState } from "react";

import { getCurrentConsent } from "@/lib/consent";
import track from "@/lib/track";
import type { SearchSuggestItem, SearchSuggestResponse } from "@/types/search";

type Props = {
  defaultQuery?: string;
};

export default function SearchAssist({ defaultQuery = "" }: Props) {
  const [query, setQuery] = useState(defaultQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestItem[]>([]);
  const [loading, setLoading] = useState(false);

  const canTrack = () => {
    try {
      return getCurrentConsent().analytics;
    } catch {
      return false;
    }
  };

  const fetchSuggestions = useCallback(async (value: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(value)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as SearchSuggestResponse;
      setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(query.trim());
    }, 150);
    return () => clearTimeout(handler);
  }, [query, fetchSuggestions]);

  return (
    <div className="mt-6">
      <form
        className="flex gap-3"
        action="/search"
        method="get"
        role="search"
        aria-label="Buscar no site"
        onSubmit={() => {
          if (canTrack()) {
            track.event?.("search_query_submit", { query: query.trim() || null });
          }
        }}
      >
        <label htmlFor="site-search" className="sr-only">
          Buscar no site
        </label>
        <input
          type="search"
          name="q"
          id="site-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar..."
          className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          type="submit"
        >
          Buscar
        </button>
      </form>

      <div className="mt-4 rounded-md border border-zinc-200 bg-white p-3">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Sugestoes</span>
          {loading ? <span>Carregando...</span> : null}
        </div>
        {suggestions.length ? (
          <ul className="mt-3 space-y-2">
            {suggestions.map((item) => (
              <li key={item.url} className="flex items-start justify-between gap-3 text-sm">
                <a
                  href={item.url}
                  className="font-medium text-emerald-700 hover:underline"
                  onClick={() => {
                    if (canTrack()) {
                      track.event?.("search_suggest_click", {
                        query: query.trim() || null,
                        url: item.url,
                        title: item.title,
                      });
                    }
                  }}
                >
                  {item.title}
                </a>
                <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">{item.reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-zinc-500">Sem sugestoes ainda.</p>
        )}
      </div>
    </div>
  );
}
