import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";

import { MetricCard } from "./components/MetricCard";
import { BarChart } from "./components/BarChart";
import { LineChart } from "./components/LineChart";
import { PieChart } from "./components/PieChart";
import { analyzeConversion } from "@/lib/ai/conversion-analyzer";
import { generateDashboardNarrative } from "@/lib/ai/dashboard-narrative";
import { generateDecisions } from "@/lib/ai/decision-engine";
import { generateDeepInsights } from "@/lib/ai/deep-insights";
import { generateOperationalAlerts } from "@/lib/ai/operational-alerts";
import { generatePriorityTasks } from "@/lib/ai/priority-engine";
import { recalcDemandPredictions } from "@/lib/ai/demand-prediction";
import { runAutopilotSeo } from "@/lib/ai/autopilot-seo";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const metadata: Metadata = {
  title: "Analytics | Admin",
  robots: { index: false, follow: false },
};

type LeadRow = {
  id: string;
  created_at: string;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  page_slug?: string | null;
  page?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
};

type PuppyRow = {
  id: string;
  name: string;
  status?: string | null;
  color?: string | null;
  price_cents?: number | null;
  slug?: string | null;
};

type InteractionRow = {
  lead_id: string;
  response_time_minutes?: number | null;
  messages_sent?: number | null;
  created_at?: string | null;
};

function startOfDayIso(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function fetchLeads(sb: SupabaseClient, sinceIso: string) {
  const { data } = await sb
    .from("leads")
    .select("id,created_at,cor_preferida,sexo_preferido,page_slug,page,utm_source,utm_medium")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false });
  return (data ?? []) as LeadRow[];
}

async function fetchLeadsLimited(sb: SupabaseClient, limit: number) {
  const { data } = await sb
    .from("leads")
    .select("id,created_at,cor_preferida,sexo_preferido,page_slug,page,utm_source,utm_medium")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as LeadRow[];
}

async function fetchPuppies(sb: SupabaseClient) {
  const { data } = await sb
    .from("puppies")
    .select("id,name,status,color,price_cents,slug")
    .order("created_at", { ascending: false });
  return (data ?? []) as PuppyRow[];
}

async function fetchInteractions(sb: SupabaseClient, sinceIso: string) {
  try {
    const { data } = await sb
      .from("lead_interactions")
      .select("lead_id,response_time_minutes,messages_sent,created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false });
    return (data ?? []) as InteractionRow[];
  } catch {
    return [] as InteractionRow[];
  }
}

export default async function AnalyticsPage({ searchParams }: { searchParams: { period?: string } }) {
  const periodDays = Number(searchParams?.period) || 30;
  const sb = supabaseAdmin();

  const now = new Date();
  const startToday = startOfDayIso(now);
  const start7d = daysAgoIso(7);
  const start30d = daysAgoIso(periodDays);

  const [
    leadsToday,
    leads7d,
    leadsRange,
    latestLeads,
    puppies,
    interactions,
    demandPredictions,
    autopilotSeo,
    deepInsights,
    decisions,
    narrative,
    alerts,
    priorityTasks,
  ] = await Promise.all([
    fetchLeads(sb, startToday),
    fetchLeads(sb, start7d),
    fetchLeads(sb, start30d),
    fetchLeadsLimited(sb, 10),
    fetchPuppies(sb),
    fetchInteractions(sb, start30d),
    recalcDemandPredictions(),
    runAutopilotSeo(),
    generateDeepInsights(),
    generateDecisions(),
    generateDashboardNarrative(),
    generateOperationalAlerts(),
    generatePriorityTasks(),
  ]);

  const puppiesByStatus = puppies.reduce(
    (acc, p) => {
      const key = (p.status ?? "unknown") as string;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const leadsByDay = (() => {
    const buckets = new Map<string, number>();
    leadsRange.forEach((l) => {
      const d = new Date(l.created_at);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));
  })();

  const leadsByColor = (() => {
    const buckets = new Map<string, number>();
    leadsRange.forEach((l) => {
      const key = (l.cor_preferida || "Não informado").toLowerCase();
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
  })();

  const leadsBySex = (() => {
    const buckets = new Map<string, number>();
    leadsRange.forEach((l) => {
      const key = (l.sexo_preferido || "Indiferente").toLowerCase();
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
  })();

  const leadsBySource = (() => {
    const buckets = new Map<string, number>();
    leadsRange.forEach((l) => {
      const key = l.utm_source || l.utm_medium || l.page || "desconhecido";
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  })();

  const topPuppies = (() => {
    const buckets = new Map<string, number>();
    leadsRange.forEach((l) => {
      const slug = l.page_slug || l.page;
      if (!slug) return;
      buckets.set(slug, (buckets.get(slug) ?? 0) + 1);
    });
    const enriched = Array.from(buckets.entries()).map(([slug, value]) => {
      const puppy = puppies.find((p) => p.slug === slug);
      return { label: puppy?.name || slug, value };
    });
    return enriched.sort((a, b) => b.value - a.value).slice(0, 5);
  })();

  const conversionInsights = analyzeConversion(leadsRange as any, puppies as any, interactions as any);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">Analytics</h1>
          <p className="text-sm text-[var(--text-muted)]">Visão consolidada de leads e demanda.</p>
        </div>
        <form className="flex items-center gap-2 text-sm">
          <label className="text-[var(--text)]" htmlFor="period">
            Período
          </label>
          <select
            id="period"
            name="period"
            defaultValue={periodDays}
            className="h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            Aplicar
          </button>
        </form>
      </header>

      <section aria-label="Métricas principais" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Leads hoje" value={leadsToday.length} />
        <MetricCard label="Leads 7 dias" value={leads7d.length} />
        <MetricCard label={`Leads ${periodDays} dias`} value={leadsRange.length} />
        <MetricCard
          label="Conversão estimada"
          value={`${Math.min(Math.round((leadsRange.length / Math.max(puppies.length, 1)) * 100), 100)}%`}
          description="Ajuste quando status de venda estiver disponível"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3" aria-label="Cards de status">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--text)]">Status do estoque</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
              <dt className="text-[var(--text-muted)]">Disponíveis</dt>
              <dd className="text-lg font-semibold text-[var(--text)]">{puppiesByStatus["available"] ?? 0}</dd>
            </div>
            <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
              <dt className="text-[var(--text-muted)]">Reservados</dt>
              <dd className="text-lg font-semibold text-[var(--text)]">{puppiesByStatus["reserved"] ?? 0}</dd>
            </div>
            <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
              <dt className="text-[var(--text-muted)]">Vendidos</dt>
              <dd className="text-lg font-semibold text-[var(--text)]">{puppiesByStatus["sold"] ?? 0}</dd>
            </div>
            <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
              <dt className="text-[var(--text-muted)]">Total</dt>
              <dd className="text-lg font-semibold text-[var(--text)]">{puppies.length}</dd>
            </div>
          </dl>
        </div>

        <LineChart data={leadsByDay} title="Leads por dia" />
        <PieChart data={leadsByColor.slice(0, 6)} title="Demanda por cor" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label="Interesse por sexo e origem">
        <BarChart data={leadsBySex} title="Interesse por sexo" />
        <BarChart data={leadsBySource} title="Origem dos leads (UTM/referrer)" />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-label="Listagens auxiliares">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text)]">Últimos leads</h2>
          <table className="mt-3 w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-[var(--text-muted)]">
                <th className="pb-2">Data</th>
                <th className="pb-2">Cor</th>
                <th className="pb-2">Sexo</th>
                <th className="pb-2">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {latestLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[var(--surface)]">
                  <td className="py-2 pr-2 text-[var(--text)]">
                    {new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </td>
                  <td className="py-2 pr-2 text-[var(--text-muted)]">{lead.cor_preferida || "—"}</td>
                  <td className="py-2 pr-2 text-[var(--text-muted)]">{lead.sexo_preferido || "—"}</td>
                  <td className="py-2 pr-2 text-[var(--text-muted)]">{lead.utm_source || lead.page || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text)]">Filhotes mais buscados</h2>
          <ol className="mt-3 space-y-2 text-sm text-[var(--text)]">
            {topPuppies.length === 0 && <li className="text-[var(--text-muted)]">Sem dados no período.</li>}
            {topPuppies.map((p, idx) => (
              <li key={p.label} className="flex items-center justify-between rounded-lg bg-[var(--surface)] px-3 py-2">
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {idx + 1}
                  </span>
                  {p.label}
                </span>
                <span className="text-sm font-semibold text-[var(--text)]">{p.value} leads</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-label="Insights da IA">
        <h2 className="text-lg font-semibold text-[var(--text)]">Insights da IA</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Gargalos do funil e recomendações automáticas.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text)]">Gargalos</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
              {conversionInsights.bottlenecks.length === 0 && <li>Sem gargalos críticos.</li>}
              {conversionInsights.bottlenecks.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text)]">Perdas</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
              {conversionInsights.losses.length === 0 && <li>Sem perdas significativas.</li>}
              {conversionInsights.losses.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-sm font-semibold text-[var(--text)]">Recomendações</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
            {conversionInsights.recommendations.length === 0 && <li>Sem recomendações no momento.</li>}
            {conversionInsights.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="text-xs text-[var(--text-muted)]">Resumo: {conversionInsights.summary}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-label="Previsão de demanda">
        <h2 className="text-lg font-semibold text-[var(--text)]">Previsão de demanda (próximas 4 semanas)</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Estimativa de leads por cor/sexo e riscos de falta.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {demandPredictions.slice(0, 6).map((pred, idx) => (
            <div key={`${pred.color}-${pred.sex}-${idx}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-sm font-semibold text-[var(--text)]">
                {pred.color} · {pred.sex} · {pred.predicted_leads} leads
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {pred.week_start_date} a {pred.week_end_date}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{pred.recommendation}</p>
              {pred.risk_alert && <p className="text-xs font-semibold text-rose-700">{pred.risk_alert}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-label="Decisões da IA">
        <h2 className="text-lg font-semibold text-[var(--text)]">Decisões da IA</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Ações sugeridas com explicação.</p>
        <ul className="space-y-2">
          {decisions.map((d, idx) => (
            <li
              key={`${d.title}-${idx}`}
              className={`rounded-lg border border-[var(--border)] px-3 py-2 text-sm ${
                d.severity === "critical"
                  ? "bg-rose-50 text-rose-800"
                  : d.severity === "warning"
                  ? "bg-amber-50 text-amber-800"
                  : "bg-[var(--surface)] text-[var(--text)]"
              }`}
            >
              <p className="font-semibold">{d.title}</p>
              <p>{d.action}</p>
              <p className="text-xs text-[var(--text-muted)]">{d.reason}</p>
            </li>
          ))}
          {decisions.length === 0 && <li className="text-sm text-[var(--text-muted)]">Sem decisões no momento.</li>}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Alertas operacionais (OperationalAlertsAI)</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Monitoramento de overbooking, estoque e follow-up.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <AlertList title="Críticos" items={alerts.critical} tone="critical" />
          <AlertList title="Médios" items={alerts.medium} tone="warning" />
          <AlertList title="Baixos" items={alerts.low} tone="info" />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Narrativa executiva (DashboardNarrativeAI)</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Resumo textual da operação e próximos passos.</p>
        <div className="space-y-2">
          <div className="rounded-lg bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">{narrative.summary}</div>
          {narrative.opportunities.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Oportunidades</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
                {narrative.opportunities.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          )}
          {narrative.risks.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Riscos</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
                {narrative.risks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {narrative.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Recomendações</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
                {narrative.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Prioridades (PriorityEngine)</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Ordens de ação para operação diária.</p>
        <ul className="space-y-2">
          {priorityTasks.map((t, idx) => (
            <li
              key={`${t.title}-${idx}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            >
              <p className="font-semibold text-[var(--text)]">{t.title}</p>
              <p className="text-[var(--text-muted)]">{t.detail}</p>
              <p className="text-xs text-[var(--text-muted)]">Prioridade: {t.priority}</p>
            </li>
          ))}
          {priorityTasks.length === 0 && <li className="text-sm text-[var(--text-muted)]">Sem tarefas priorizadas.</li>}
        </ul>
      </section>
    </div>
  );
}

function AlertList({ title, items, tone }: { title: string; items: string[]; tone: "critical" | "warning" | "info" }) {
  const toneClass =
    tone === "critical"
      ? "bg-rose-50 text-rose-800 border-rose-200"
      : tone === "warning"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]";
  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-1 space-y-1 text-sm">
        {items.map((it) => (
          <li key={it} className="leading-snug">
            {it}
          </li>
        ))}
        {items.length === 0 && <li className="text-[var(--text-muted)]">Sem alertas.</li>}
      </ul>
    </div>
  );
}
