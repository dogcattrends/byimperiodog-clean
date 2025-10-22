"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { FiltersBar, type DashboardFilters } from "@/components/dashboard/FiltersBar";
import { Header } from "@/components/dashboard/Header";
import { Main } from "@/components/dashboard/Main";
import { ErrorState } from "@/components/dashboard/states";
import { adminFetch } from "@/lib/adminFetch";
import { describeAdminStreak, readAdminStreak, type AdminStreak } from "@/lib/adminStreak";

interface CoverageSummary {
  percent: number;
  covered: number;
  total: number;
  missingCount: number;
  missingTitles?: string[];
}

interface SeoMissingItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  missing: string[];
}

interface SeoInsights {
  coverage: CoverageSummary;
  missingMeta: { total: number; items: SeoMissingItem[] };
  aiSessions: {
    active: number;
    error: number;
    completed7d: number;
    latest: { id: string; topic: string; status: string; phase: string; progress: number; updated_at?: string; created_at: string }[];
    ideas: { id: string; topic: string; primary_keyword: string; angle: string; created_at: string }[];
  };
}

interface Metrics {
  ok: boolean;
  range: number;
  leadsHoje: number;
  deltaHoje: number;
  leadsCount: number;
  leadStatus?: Record<string, number>;
  conversao: number;
  series: number[];
  mediaDia: number;
  topFontes: { src: string; count: number; pct: number }[];
  recent: Array<{ id: string; name?: string; phone?: string; email?: string; created_at: string }>;
  pupStatus: Record<string, number>;
  contratos: number;
  contractStatus?: Record<string, number>;
  postsCount: number;
  postsPublished: number;
  publishSeries: number[];
  contentStatus?: Record<string, number>;
  reviewQueue?: { id: string; title: string; status: string; scheduled_at?: string | null; slug: string }[];
  authorLeaderboard?: { id: string; name: string; posts: number }[];
  categoryBreakdown?: { category: string; count: number }[];
  coverage: CoverageSummary;
  latestPosts: { id: string; slug: string; title: string; status: string; published_at: string | null }[];
  ctr: { ratio: number; interactions: number; pageViews: number };
  seoInsights?: SeoInsights;
  aiTasks?: {
    byStatus: Record<string, number>;
    recent: { id: string; topic: string | null; status: string; progress: number; phase?: string | null; created_at: string; finished_at?: string | null }[];
  };
  upcomingEvents?: { id: string; post_id: string | null; run_at: string; action: string; post_title: string | null }[];
  pendingComments?: { id: string; post_id: string | null; author_name: string | null; excerpt: string; created_at: string; post_title: string | null }[];
  recentRevisions?: { id: string; post_id: string | null; created_at: string; created_by: string | null; post_title: string | null }[];
}

type Quest = {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  done: boolean;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  value: string;
  unlocked: boolean;
};

type XpProfile = {
  level: number;
  percent: number;
  xpInLevel: number;
  xpToNext: number;
  label: string;
  xpTotal: number;
};

const ranges = [7, 30, 90] as const;
const numberFormatter = new Intl.NumberFormat("pt-BR");
const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const motionConfig = prefersReducedMotion()
  ? { initial: undefined, animate: undefined }
  : {
      initial: "hidden" as const,
      animate: "show" as const,
      variants: {
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      },
    };

const childVariant = prefersReducedMotion()
  ? undefined
  : {
      hidden: { opacity: 0, y: 8 },
      show: { opacity: 1, y: 0 },
    };

function questPercent(quest: Quest): number {
  if (!quest.target) return quest.done ? 100 : 0;
  return Math.min(100, Math.round((quest.progress / quest.target) * 100));
}

function publishToday(series: number[] | undefined): number {
  if (!series || !series.length) return 0;
  return series[Math.max(0, series.length - 1)];
}

function toTitleCase(label: string) {
  return label
    .split(/[_\s]+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

function recordEntries(record: Record<string, number> | undefined) {
  if (!record) return [] as Array<{ key: string; value: number }>;
  return Object.entries(record)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
}

function buildQuests(metrics: Metrics | null): Quest[] {
  if (!metrics) return [];
  const targetLeads = Math.max(5, Math.round(metrics.mediaDia * 1.2));
  const todayPublish = publishToday(metrics.publishSeries);
  const commentsPending = metrics.pendingComments?.length ?? 0;
  const reviewPending = metrics.reviewQueue?.length ?? 0;
  const aiCompleted = metrics.seoInsights?.aiSessions.completed7d ?? 0;
  return [
    {
      id: "leads",
      title: "Bater meta de leads",
      description: `Meta diaria: ${targetLeads} leads`,
      progress: Math.min(metrics.leadsHoje, targetLeads),
      target: targetLeads,
      done: metrics.leadsHoje >= targetLeads,
    },
    {
      id: "publish",
      title: "Publicar novidade",
      description: todayPublish > 0 ? "Post publicado hoje." : "Publique pelo menos 1 post hoje.",
      progress: Math.min(todayPublish, 1),
      target: 1,
      done: todayPublish >= 1,
    },
    {
      id: "review",
      title: "Liberar fila de revisao",
      description: reviewPending === 0 ? "Nenhum item aguardando." : `${reviewPending} aguardando revisao.`,
      progress: reviewPending === 0 ? 1 : 0,
      target: 1,
      done: reviewPending === 0,
    },
    {
      id: "feedback",
      title: "Responder comentarios",
      description: commentsPending === 0 ? "Caixa zerada." : `${commentsPending} comentarios pendentes.`,
      progress: commentsPending === 0 ? 1 : 0,
      target: 1,
      done: commentsPending === 0,
    },
    {
      id: "ai",
      title: "Concluir sessao de IA",
      description: aiCompleted > 0 ? "Sessao concluida esta semana." : "Finalize uma sessao de IA editorial.",
      progress: Math.min(aiCompleted, 1),
      target: 1,
      done: aiCompleted > 0,
    },
  ];
}

function buildAchievements(metrics: Metrics | null): Achievement[] {
  if (!metrics) return [];
  const coverageUnlocked = metrics.coverage.percent >= 85;
  const ctrUnlocked = metrics.ctr.ratio >= 15;
  const contractsWon = metrics.contractStatus?.ganho || metrics.contractStatus?.concluido || 0;
  const commentsZero = (metrics.pendingComments?.length ?? 0) === 0;
  return [
    {
      id: "coverage",
      title: coverageUnlocked ? "Mapa completo" : "Expandir cobertura",
      description: "Cobertura de clusters acima de 85%.",
      value: `${metrics.coverage.percent}%`,
      unlocked: coverageUnlocked,
    },
    {
      id: "ctr",
      title: ctrUnlocked ? "Atracao poderosa" : "Fortalecer interacoes",
      description: "CTR acima de 15% consolidada.",
      value: `${metrics.ctr.ratio}% CTR`,
      unlocked: ctrUnlocked,
    },
    {
      id: "contracts",
      title: contractsWon ? "Gerador de contratos" : "Fechar contrato",
      description: "Registrar ao menos um contrato no periodo.",
      value: `${metrics.contratos}`,
      unlocked: Boolean(contractsWon),
    },
    {
      id: "feedback",
      title: commentsZero ? "Caixa limpa" : "Responder leitores",
      description: "Nenhum comentario aguardando aprovacao.",
      value: `${metrics.pendingComments?.length ?? 0}`,
      unlocked: commentsZero,
    },
  ];
}

function buildXpProfile(metrics: Metrics | null): XpProfile {
  if (!metrics) {
    return { level: 1, percent: 0, xpInLevel: 0, xpToNext: 220, label: "Explorador iniciante", xpTotal: 0 };
  }
  const aiCompleted = metrics.seoInsights?.aiSessions.completed7d ?? 0;
  const contractsWon = metrics.contractStatus?.ganho || metrics.contractStatus?.concluido || 0;
  const xp = Math.max(
    0,
    Math.round(
      metrics.leadsCount * 1.2 +
        metrics.postsPublished * 30 +
        metrics.coverage.percent * 1.5 +
        metrics.ctr.ratio * 2 +
        aiCompleted * 25 +
        contractsWon * 25,
    ),
  );
  const xpToNext = 220;
  const level = Math.max(1, Math.floor(xp / xpToNext) + 1);
  const xpInLevel = xp % xpToNext;
  const percent = Math.min(100, Math.round((xpInLevel / xpToNext) * 100));
  let label = "Explorador iniciante";
  if (level >= 6) label = "Mestre do conteudo";
  else if (level >= 4) label = "Estrategista ativo";
  else if (level >= 3) label = "Guia em crescimento";
  return { level, percent, xpInLevel, xpToNext, label, xpTotal: xp };
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({ q: "", status: "", date: "" });
  const [timeframe, setTimeframe] = useState<(typeof ranges)[number]>(30);
  const [streak, setStreak] = useState<AdminStreak>({ count: 0, lastLogin: null });

  const load = useCallback(async (range: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminFetch(`/api/admin/dashboard/metrics?range=${range}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao carregar metricas");
      const json = (await response.json()) as Metrics;
      setMetrics(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(timeframe);
  }, [load, timeframe]);

  useEffect(() => {
    setStreak(readAdminStreak());
  }, []);

  const xpProfile = useMemo(() => buildXpProfile(metrics), [metrics]);
  const quests = useMemo(() => buildQuests(metrics), [metrics]);
  const questCompletion = useMemo(() => {
    if (!quests.length) return 0;
    const completed = quests.filter((quest) => quest.done).length;
    return Math.round((completed / quests.length) * 100);
  }, [quests]);
  const achievements = useMemo(() => buildAchievements(metrics), [metrics]);
  const streakDescription = useMemo(() => describeAdminStreak(streak), [streak]);
  const coverageLabel = metrics ? `${metrics.coverage.percent}%` : "--";
  const publishSpark = metrics?.publishSeries ?? [];
  const leadStatusEntries = useMemo(() => recordEntries(metrics?.leadStatus), [metrics?.leadStatus]);
  const contractStatusEntries = useMemo(() => recordEntries(metrics?.contractStatus), [metrics?.contractStatus]);
  const contentStatusEntries = useMemo(() => recordEntries(metrics?.contentStatus), [metrics?.contentStatus]);
  const aiStatusEntries = useMemo(() => recordEntries(metrics?.aiTasks?.byStatus), [metrics?.aiTasks?.byStatus]);

  const pendingComments = metrics?.pendingComments ?? [];
  const upcomingEvents = metrics?.upcomingEvents ?? [];
  const reviewQueue = metrics?.reviewQueue ?? [];
  const authorLeaderboard = metrics?.authorLeaderboard ?? [];
  const categoryBreakdown = metrics?.categoryBreakdown ?? [];
  const aiRecent = metrics?.aiTasks?.recent ?? [];
  const recentRevisions = metrics?.recentRevisions ?? [];

  const handleRangeChange = (range: (typeof ranges)[number]) => {
    if (range === timeframe) return;
    setTimeframe(range);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 rounded bg-[var(--accent)] px-3 py-2 text-[var(--accent-contrast)]"
      >
        Pular para conteudo
      </a>
      <Header />
      <Main>
        <motion.div {...motionConfig} className="space-y-10" id="main">
          {error ? (
            <ErrorState
              message="Não conseguimos carregar os dados. Verifique sua conexão ou tente novamente em instantes."
              retry={() => load(timeframe)}
            />
          ) : null}

          <motion.section variants={childVariant} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
            <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
              <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-300/15 blur-3xl" aria-hidden />
              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Nivel {xpProfile.level}
                  </span>
                  <h1 className="mt-3 text-2xl font-semibold text-[var(--text)]">Radar da operacao</h1>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Acompanhe o progresso do blog, desbloqueie conquistas e priorize as missoes que mantem o time na dianteira.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1 text-xs font-semibold">
                  {ranges.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => handleRangeChange(range)}
                      className={`rounded-full px-3 py-1 transition ${
                        timeframe === range
                          ? "bg-emerald-600 text-white shadow"
                          : "text-[var(--text-muted)] hover:bg-white"
                      }`}
                      disabled={loading && timeframe !== range}
                    >
                      {range}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{xpProfile.label}</span>
                    <span>{xpProfile.percent}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/60">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
                      style={{ width: `${xpProfile.percent}%` }}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {xpProfile.xpInLevel}/{xpProfile.xpToNext} XP ate o proximo nivel
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Leads hoje</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text)]">
                    {metrics ? numberFormatter.format(metrics.leadsHoje) : "--"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {metrics ? `${metrics.deltaHoje >= 0 ? "+" : ""}${metrics.deltaHoje}% vs ontem` : "Calculando..."}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Cobertura</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text)]">{coverageLabel}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {metrics ? `${metrics.coverage.covered}/${metrics.coverage.total} clusters ativos` : "Atualizando..."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex h-full flex-col gap-4">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[var(--text)]">Missoes do dia</h2>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {questCompletion}%
                  </span>
                </div>
                <ul className="mt-4 space-y-3 text-xs">
                  {quests.length ? (
                    quests.map((quest) => (
                      <li key={quest.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                        <div className="flex items-center justify-between text-[var(--text)]">
                          <span className="font-semibold">{quest.title}</span>
                          <span>{quest.done ? "Concluida" : `${Math.min(quest.progress, quest.target)}/${quest.target}`}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-white/40">
                          <div
                            className={`h-full rounded-full ${quest.done ? "bg-emerald-500" : "bg-amber-500"}`}
                            style={{ width: `${questPercent(quest)}%` }}
                            aria-hidden
                          />
                        </div>
                        <p className="mt-2 text-[var(--text-muted)]">{quest.description}</p>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-4 text-center text-[var(--text-muted)]">
                      {loading ? "Carregando missoes..." : "Sem missoes cadastradas para este periodo."}
                    </li>
                  )}
                </ul>
                <p className="mt-4 text-xs text-[var(--text-muted)]">
                  Sequencia atual: {streak.count} dia(s). {streakDescription}
                </p>
              </div>
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl">
                <h2 className="text-base font-semibold text-[var(--text)]">Conquistas</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {achievements.map((achievement) => (
                    <li
                      key={achievement.id}
                      className={`rounded-2xl border p-4 text-xs transition ${
                        achievement.unlocked
                          ? "border-emerald-400 bg-emerald-500/10 text-emerald-800"
                          : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]"
                      }`}
                    >
                      <p className="text-sm font-semibold text-[var(--text)]">{achievement.title}</p>
                      <p className="mt-1 text-[var(--text-muted)]">{achievement.description}</p>
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text)]">
                        {achievement.value}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.section>

          <motion.section variants={childVariant} className="grid gap-4 xl:grid-cols-4">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--text)]">Pipeline de leads</h3>
              <ul className="mt-3 space-y-2 text-xs">
                {leadStatusEntries.length ? (
                  leadStatusEntries.map(({ key, value }) => {
                    const total = metrics?.leadsCount || 0;
                    const percent = total ? Math.round((value / total) * 100) : 0;
                    return (
                      <li key={key} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[var(--text)]">{toTitleCase(key)}</span>
                          <span className="tabular-nums text-[var(--text-muted)]">{percent}% ({value})</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--surface-2)]">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(percent, 100)}%` }} aria-hidden />
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="text-[var(--text-muted)]">Sem dados suficientes.</li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--text)]">Contratos</h3>
              <ul className="mt-3 space-y-2 text-xs">
                {contractStatusEntries.length ? (
                  contractStatusEntries.map(({ key, value }) => (
                    <li key={key} className="flex items-center justify-between">
                      <span>{toTitleCase(key)}</span>
                      <span className="tabular-nums text-[var(--text-muted)]">{value}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[var(--text-muted)]">Sem contratos no periodo.</li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--text)]">Conteudo por status</h3>
              <ul className="mt-3 space-y-2 text-xs">
                {contentStatusEntries.length ? (
                  contentStatusEntries.map(({ key, value }) => (
                    <li key={key} className="flex items-center justify-between">
                      <span>{toTitleCase(key)}</span>
                      <span className="tabular-nums text-[var(--text-muted)]">{value}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[var(--text-muted)]">Sem posts cadastrados.</li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--text)]">Comentarios pendentes</h3>
              <p className="mt-2 text-3xl font-semibold text-[var(--text)]">{pendingComments.length}</p>
              <p className="text-xs text-[var(--text-muted)]">Aguardando aprovacao</p>
              <ul className="mt-3 space-y-2 text-xs">
                {pendingComments.slice(0, 2).map((comment) => (
                  <li key={comment.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <p className="font-medium text-[var(--text)]">{comment.author_name || "Anonimo"}</p>
                    <p className="mt-1 line-clamp-2 text-[var(--text-muted)]">{comment.excerpt || ""}</p>
                    {comment.post_id ? (
                      <Link
                        href={`/admin/blog/editor?id=${comment.post_id}`}
                        className="mt-2 inline-flex text-[10px] font-semibold text-[var(--accent)] hover:underline"
                      >
                        Abrir post
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>

          <motion.section variants={childVariant} className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-base font-semibold text-[var(--text)]">Categorias em destaque</h2>
              <ul className="mt-3 space-y-2 text-xs">
                {categoryBreakdown.length ? (
                  categoryBreakdown.map((item) => (
                    <li key={item.category} className="flex items-center justify-between gap-3">
                      <span className="font-medium text-[var(--text)]">{toTitleCase(item.category)}</span>
                      <span className="tabular-nums text-[var(--text-muted)]">{item.count}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[var(--text-muted)]">Nenhuma categoria catalogada.</li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-base font-semibold text-[var(--text)]">Autores ativos</h2>
              <ul className="mt-3 space-y-2 text-xs">
                {authorLeaderboard.length ? (
                  authorLeaderboard.map((author) => (
                    <li key={author.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-[11px] font-semibold text-[var(--text)]">
                          {author.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text)]">{author.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{author.posts} post(s)</p>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-[var(--text-muted)]">Nenhum autor registrado.</li>
                )}
              </ul>
            </div>
          </motion.section>
          <motion.section variants={childVariant} className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-base font-semibold text-[var(--text)]">Agenda</h2>
              <ul className="mt-3 space-y-2 text-xs">
                {upcomingEvents.length ? (
                  upcomingEvents.map((event) => (
                    <li key={event.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[var(--text)]">{toTitleCase(event.action)}</span>
                        <span className="tabular-nums text-[var(--text-muted)]">
                          {dayFormatter.format(new Date(event.run_at))} {timeFormatter.format(new Date(event.run_at))}
                        </span>
                      </div>
                      <p className="mt-1 text-[var(--text-muted)]">{event.post_title || "Post"}</p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-4 text-center text-[var(--text-muted)]">
                    Nenhum evento agendado.
                  </li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-base font-semibold text-[var(--text)]">Fila de revisao</h2>
              <ul className="mt-3 space-y-2 text-xs">
                {reviewQueue.length ? (
                  reviewQueue.map((item) => (
                    <li key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/admin/blog/editor?id=${item.id}`} className="font-medium text-[var(--text)] hover:underline">
                          {item.title}
                        </Link>
                        <span className="text-[10px] uppercase text-[var(--text-muted)]">{item.status}</span>
                      </div>
                      {item.scheduled_at ? (
                        <p className="mt-1 text-[var(--text-muted)]">Agendado para {dayFormatter.format(new Date(item.scheduled_at))}</p>
                      ) : null}
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-4 text-center text-[var(--text-muted)]">
                    Nenhum item aguardando revisao.
                  </li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-base font-semibold text-[var(--text)]">Ultimas revisoes</h2>
              <ul className="mt-3 space-y-2 text-xs">
                {recentRevisions.length ? (
                  recentRevisions.map((revision) => (
                    <li key={revision.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[var(--text)]">{revision.post_title || "Post"}</span>
                        <span className="tabular-nums text-[var(--text-muted)]">{dayFormatter.format(new Date(revision.created_at))}</span>
                      </div>
                      <p className="text-[var(--text-muted)]">Por {revision.created_by || "Equipe"}</p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-4 text-center text-[var(--text-muted)]">
                    Nenhuma revisao registrada recentemente.
                  </li>
                )}
              </ul>
            </div>
          </motion.section>

          <motion.section variants={childVariant} className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-base font-semibold text-[var(--text)]">AI editorial</h2>
              <ul className="mt-3 space-y-2 text-xs">
                {aiStatusEntries.length ? (
                  aiStatusEntries.map(({ key, value }) => (
                    <li key={key} className="flex items-center justify-between">
                      <span>{toTitleCase(key)}</span>
                      <span className="tabular-nums text-[var(--text-muted)]">{value}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[var(--text-muted)]">Nenhuma tarefa registrada.</li>
                )}
              </ul>
              <div className="mt-4 space-y-2 text-xs">
                <p className="text-[10px] uppercase text-[var(--text-muted)]">Recentes</p>
                {aiRecent.length ? (
                  <ul className="space-y-1">
                    {aiRecent.map((task) => (
                      <li key={task.id} className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                        <span className="truncate text-[var(--text)]">{task.topic || "Tarefa"}</span>
                        <span className="text-[10px] uppercase text-[var(--text-muted)]">{task.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[var(--text-muted)]">Sem tarefas recentes.</p>
                )}
              </div>
              <Link href="/admin/blog/ai" className="mt-4 inline-flex text-xs font-semibold text-emerald-700 hover:underline">
                Gerenciar pipeline de IA
              </Link>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-base font-semibold text-[var(--text)]">Comentarios</h2>
              <ul className="mt-3 space-y-2 text-xs">
                {pendingComments.length ? (
                  pendingComments.map((comment) => (
                    <li key={comment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[var(--text)]">{comment.author_name || "Anonimo"}</span>
                        <span className="tabular-nums text-[var(--text-muted)]">{dayFormatter.format(new Date(comment.created_at))}</span>
                      </div>
                      <p className="mt-1 line-clamp-3 text-[var(--text-muted)]">{comment.excerpt}</p>
                      {comment.post_id ? (
                        <Link href={`/admin/blog/editor?id=${comment.post_id}`} className="mt-2 inline-flex text-[10px] font-semibold text-[var(--accent)] hover:underline">
                          Revisar agora
                        </Link>
                      ) : null}
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-4 text-center text-[var(--text-muted)]">
                    Nenhum comentario aguardando aprovacao.
                  </li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-base font-semibold text-[var(--text)]">Status dos filhotes</h2>
              <ul className="mt-3 space-y-2 text-xs">
                {metrics && Object.keys(metrics.pupStatus).length ? (
                  Object.entries(metrics.pupStatus).map(([status, count]) => (
                    <li key={status} className="flex items-center justify-between">
                      <span>{toTitleCase(status)}</span>
                      <span className="tabular-nums text-[var(--text-muted)]">{count}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[var(--text-muted)]">Nenhum filhote cadastrado.</li>
                )}
              </ul>
            </div>
          </motion.section>

          <motion.section variants={childVariant} className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Publicacoes (30d)"
              type="line"
              labels={publishSpark.map((_, index) => String(index + 1))}
              datasets={[
                {
                  label: "Posts",
                  data: publishSpark,
                  borderColor: "var(--accent)",
                  backgroundColor: "var(--accent)",
                },
              ]}
            />
            <ChartCard
              title="Leads (7d)"
              type="bar"
              labels={["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]}
              datasets={[
                {
                  label: "Leads",
                  data: (metrics?.series || []).slice(-7),
                  backgroundColor: "var(--surface-2)",
                  borderColor: "var(--accent)",
                },
              ]}
              description="Ultimos 7 dias"
            />
          </motion.section>

          <motion.section variants={childVariant} className="space-y-3">
            <h2 className="text-sm font-semibold tracking-tight">Ultimos posts</h2>
            <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[13px]">
              {metrics?.latestPosts.length ? (
                metrics.latestPosts.map((post, index) => (
                  <li
                    key={post.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-[var(--surface-2)] motion-safe:animate-[fadeIn_.35s_ease_forwards] opacity-0"
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <div className="min-w-0 flex-1 truncate">
                      <Link
                        href={`/admin/blog/editor?id=${post.id}`}
                        className="font-medium hover:underline"
                        title={post.title || post.slug}
                      >
                        {post.title || post.slug}
                      </Link>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)]">{post.status}</span>
                    <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString("pt-BR").slice(0, 5)
                        : "--"}
                    </span>
                  </li>
                ))
              ) : (
                <li className="px-3 py-4 text-[12px] text-[var(--text-muted)]">
                  {loading ? "Carregando posts..." : "Sem posts recentes."}
                </li>
              )}
            </ul>
          </motion.section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Conteudo recente</h2>
            <FiltersBar value={filters} onChange={setFilters} />
            <DataTable filters={filters} />
          </section>
        </motion.div>
      </Main>
    </div>
  );
}
