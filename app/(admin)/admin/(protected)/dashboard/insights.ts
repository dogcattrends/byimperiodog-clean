import { generateDeepInsights } from "@/lib/ai/deep-insights";

import type { AIInsightPayload } from "./AIInsightsPanel";

export function mapDeepInsightsToPayload(data: unknown): AIInsightPayload {
  const d = data as {
    summary?: string;
    opportunities?: unknown[];
    risks?: unknown[];
    recommendations?: unknown[];
    dailyInsights?: unknown[];
  } | null | undefined;
  const summary = d?.summary || "Nenhum insight disponível.";
  const extractText = (item?: { detail?: string; title?: string } | null) => item?.detail || item?.title;
  const isNonEmptyString = (value: string | undefined | null | boolean): value is string =>
    typeof value === "string" && value.length > 0;
  const opportunities = (d?.opportunities || [])
    .map((item) => extractText(item as { detail?: string; title?: string } | null))
    .filter(isNonEmptyString);
  const risks = (d?.risks || [])
    .map((item) => extractText(item as { detail?: string; title?: string } | null))
    .filter(isNonEmptyString);
  const recommendationsSource = d?.recommendations && d.recommendations.length ? d.recommendations : d?.dailyInsights || [];
  const recommendations = (recommendationsSource || [])
    .map((item) => {
      const it = item as { title?: string; detail?: string } | null | undefined;
      if (it?.title && it?.detail) return `${it.title}: ${it.detail}`;
      return it?.detail || it?.title;
    })
    .filter(isNonEmptyString);

  const riskLevel: AIInsightPayload["riskLevel"] = risks.length > 2 ? "alto" : risks.length ? "medio" : "baixo";

  return {
    summary,
    opportunities,
    risks,
    recommendations,
    riskLevel,
    generatedAt: new Date().toISOString(),
  };
}

export async function refreshOperationalInsights(): Promise<AIInsightPayload> {
  const deepInsights = await generateDeepInsights();
  return mapDeepInsightsToPayload(deepInsights);
}
