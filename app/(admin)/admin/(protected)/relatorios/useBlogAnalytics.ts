import useSWR from "swr";

export interface BlogAnalyticsFilters {
  period?: string;
  author?: string;
  category?: string;
}

export function useBlogAnalytics(filters?: BlogAnalyticsFilters) {
  // Monta query string
  const params = new URLSearchParams();
  if (filters?.period) params.set("period", filters.period);
  if (filters?.author) params.set("author", filters.author);
  if (filters?.category) params.set("category", filters.category);
  const qs = params.toString();
  const url = "/api/admin/blog/analytics" + (qs ? `?${qs}` : "");
  return useSWR(url, async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro ao carregar analytics do blog");
    return res.json();
  });
}
