"use client";
// Dashboard premium shell refatorado: usa Header/Main/Sidebar e novos componentes de KPI e Chart.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';
import { Header } from '@/components/dashboard/Header';
import { Main } from '@/components/dashboard/Main';
import { motion } from 'framer-motion';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Sparkline } from '@/components/charts/Sparkline';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { EmptyState, ErrorState } from '@/components/dashboard/states';
import { DataTable } from '@/components/dashboard/DataTable';
import { FiltersBar, type DashboardFilters } from '@/components/dashboard/FiltersBar';

interface Metrics {
	leadsHoje:number; deltaHoje:number; leadsCount:number; conversao:number; series:number[]; mediaDia:number; topFontes:{src:string;count:number;pct:number}[];
	pupStatus:Record<string,number>;
	postsCount:number; postsPublished:number; publishSeries:number[]; coverage:{percent:number;covered:number;total:number;missingCount:number};
	recent:any[]; contratos:number;
	latestPosts:{ id:string; slug:string; title:string; status:string; published_at:string|null }[];
	ctr:{ ratio:number; interactions:number; pageViews:number };
}

export default function AdminDashboard(){
	const [metrics,setMetrics]=useState<Metrics|null>(null);
	const [loading,setLoading]=useState(false);
	const [error,setError]=useState<string|null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({ q:'', status:'', date:'' });
	async function load(){
		try {
			setLoading(true);
    const r= await adminFetch('/api/admin/dashboard/metrics',{cache:'no-store'});
			if(!r.ok) throw new Error('Falha ao carregar métricas');
			const j= await r.json();
				setMetrics(j as any);
		} catch(e:any){ setError(String(e?.message||e)); }
		finally { setLoading(false); }
	}
	useEffect(()=>{ load(); },[]);

		const puppiesSummary = metrics?.pupStatus ? Object.entries(metrics.pupStatus).map(([k,v])=>`${k}:${v}`).join(' · ') : '—';
		const coveragePct = metrics? metrics.coverage.percent+'%':'—';
		const publishSpark = metrics?.publishSeries || [];

	return (
		<div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
			<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 rounded bg-[var(--accent)] px-3 py-2 text-[var(--accent-contrast)]">Pular para conteúdo</a>
					<Header />
					<Main>
				<div className="space-y-10">
					<header className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
							<p className="mt-1 text-sm text-[var(--text-muted)]">Resumo rápido de conteúdo e filhotes.</p>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<button onClick={load} disabled={loading} className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-medium hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50">{loading? 'Atualizando...':'Atualizar'}</button>
							<Link href="/admin/blog/editor" className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-3 py-2 font-medium text-[var(--accent-contrast)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Novo Post</Link>
						</div>
					</header>
					{error && <ErrorState message={error} retry={load} />}
					<motion.section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" initial={typeof window!=='undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? undefined : 'hidden'} animate={typeof window!=='undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? undefined : 'show'} variants={{hidden:{}, show:{transition:{staggerChildren:0.08}}}}>
						<motion.div variants={{hidden:{opacity:0,y:8}, show:{opacity:1,y:0}}}><KpiCard label="Leads hoje" value={metrics?.leadsHoje ?? '—'} delta={metrics?.deltaHoje ?? null} deltaLabel={metrics? 'vs ontem':''} loading={loading && !metrics} ariaLive /></motion.div>
						<motion.div variants={{hidden:{opacity:0,y:8}, show:{opacity:1,y:0}}}><KpiCard label="Conversão" value={metrics? metrics.conversao+'%':'—'} deltaLabel="Leads → Contratos" loading={loading && !metrics} /></motion.div>
						<motion.div variants={{hidden:{opacity:0,y:8}, show:{opacity:1,y:0}}}><KpiCard label="Posts publicados" value={metrics?.postsPublished ?? '—'} deltaLabel={`Total ${metrics?.postsCount ?? '—'}`} series={publishSpark} loading={loading && !metrics} /></motion.div>
						<motion.div variants={{hidden:{opacity:0,y:8}, show:{opacity:1,y:0}}}><KpiCard label="Cobertura" value={coveragePct} deltaLabel={metrics? `${metrics.coverage.covered}/${metrics.coverage.total}`:''} /></motion.div>
						<motion.div variants={{hidden:{opacity:0,y:8}, show:{opacity:1,y:0}}}><KpiCard label="CTR" value={metrics? metrics.ctr.ratio+'%':'—'} deltaLabel={metrics? `${metrics.ctr.interactions}/${metrics.ctr.pageViews}`:''} /></motion.div>
					</motion.section>
					{metrics && (()=>{ const pubLabels = publishSpark.map((_,i)=> String(i+1)); return (
						<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
								<h2 className="text-sm font-semibold tracking-tight">Top Fontes</h2>
								<ul className="space-y-1 text-[12px]">
									{metrics.topFontes.map(f=> <li key={f.src} className="flex items-center justify-between"><span>{f.src}</span><span className="tabular-nums text-[var(--text-muted)]">{f.count} ({f.pct}%)</span></li>)}
									{!metrics.topFontes.length && <li className="text-[var(--text-muted)]">Sem dados</li>}
								</ul>
								<div className="pt-2 text-[11px] text-[var(--text-muted)]">Média diária: {metrics.mediaDia}</div>
							</div>
							<ChartCard title="Publicações (30d)" type="line" labels={pubLabels} datasets={[{label:'Posts', data: publishSpark, borderColor:'var(--accent)', backgroundColor:'var(--accent)'}]} />
							<ChartCard title="Leads (7d)" type="bar" labels={["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]} datasets={[{ label:'Leads', data:(metrics.series||[]).slice(-7), backgroundColor:'var(--surface-2)', borderColor:'var(--accent)'}]} description="Últimos 7 dias" />
						</section>
					)})()}
					{metrics && (
						<section className="space-y-3">
							<h2 className="text-sm font-semibold tracking-tight">Últimos Posts</h2>
							<ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[13px]">
								{(metrics?.latestPosts ?? []).map((p:any,idx:number)=> (
									<li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-[var(--surface-2)] motion-safe:animate-[fadeIn_.35s_ease_forwards] opacity-0" style={{animationDelay:`${idx*55}ms`}}>
										<div className="min-w-0 flex-1 truncate">
											<a href={`/admin/blog/editor?id=${p.id}`} className="font-medium hover:underline" title={p.title||p.slug}>{p.title||p.slug}</a>
										</div>
										<span className="text-[11px] text-[var(--text-muted)]">{p.status}</span>
										<span className="text-[11px] tabular-nums text-[var(--text-muted)]">{p.published_at? new Date(p.published_at).toLocaleDateString('pt-BR').slice(0,5):'—'}</span>
									</li>
								))}
								{!(metrics?.latestPosts?.length) && <li className="px-3 py-4 text-[12px] text-[var(--text-muted)]">Sem posts recentes.</li>}
							</ul>
						</section>
					)}
					<section className="space-y-4">
						<h2 className="text-lg font-semibold tracking-tight">Conteúdo recente</h2>
						<FiltersBar value={filters} onChange={setFilters} />
						<DataTable filters={filters} />
					</section>
				</div>
					</Main>
		</div>
	);
}

function calcCoveragePercent(_metrics:Metrics|null){
	return _metrics? _metrics.coverage.percent+'%':'—';
}

