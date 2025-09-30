import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MetricCard } from '@/components/admin/MetricCard';
import { Sparkline } from '@/components/charts/Sparkline';
import { Header } from '@/components/dashboard/Header';
import { Main } from '@/components/dashboard/Main';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { LazyReveal } from '@/components/dashboard/LazyReveal';
import fs from 'node:fs';
import path from 'node:path';

type EventRow = { id:string; name:string; value:number|null; path:string|null; ts:string; meta:any };

function groupBy<T, K extends string | number>(arr: T[], by: (x:T)=>K){
	return arr.reduce((acc: Record<K, T[]>, it)=>{ const k=by(it); (acc[k]=acc[k]||[]).push(it); return acc; }, {} as any);
}
function lastNDays(n:number){ const days: string[]=[]; const d=new Date(); for(let i=0;i<n;i++){ const di=new Date(d); di.setDate(d.getDate()-i); days.push(di.toISOString().slice(0,10)); } return days.reverse(); }

export default async function AdminAnalyticsPage(){
	const sb = supabaseAdmin();
	const since = new Date(); since.setDate(since.getDate()-14);
	const { data } = await sb.from('analytics_events').select('id,name,value,path,ts,meta').gte('ts', since.toISOString()).order('ts', { ascending:false }).limit(2000);
	const rows = (data||[]) as EventRow[];
	const byPath = groupBy(rows.filter(r=> r.path), r=> r.path as string);
	const days = lastNDays(14);
	const vitalsNames = new Set(['web_vitals_lcp','web_vitals_inp','web_vitals_cls']);
	const vitals = Object.entries(byPath).map(([p, arr])=>{
		const perDay = days.map(day=>{
			const dayRows = arr.filter(r=> r.ts.slice(0,10)===day && vitalsNames.has(r.name));
			const lcp = avg(dayRows.filter(r=> r.name==='web_vitals_lcp').map(r=> r.value||0));
			const inp = avg(dayRows.filter(r=> r.name==='web_vitals_inp').map(r=> r.value||0));
			const cls = avg(dayRows.filter(r=> r.name==='web_vitals_cls').map(r=> r.value||0));
			return { day, lcp, inp, cls };
		});
		return { path:p, series: perDay };
	});
	function avg(ns:number[]){ return ns.length? Math.round((ns.reduce((a,b)=>a+b,0)/ns.length)*100)/100 : 0; }
	const events = ['card_click','toc_click','share_click'];
	const ctr = Object.entries(byPath).map(([p, arr])=>{
		const totalViews = Math.max(1, arr.filter(r=> r.name==='web_vitals_lcp').length);
		const counts = Object.fromEntries(events.map(e=> [e, arr.filter(r=> r.name===e).length]));
		const ratios = Object.fromEntries(events.map(e=> [e, Math.round((counts[e]/totalViews)*100)]));
		return { path:p, counts, ratios } as any;
	});
	const reportPath = path.join(process.cwd(), 'reports', 'a11y-contrast.md');
	const contrastAlert = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : null;
	// Métricas agregadas básicas para cards
	const globalSeries = vitals.flatMap(v=> v.series);
	const avgLcpSeries = days.map(day=> avg(globalSeries.filter(s=> s.day===day).map(s=> s.lcp))); // média diária LCP
	const lastDay = avgLcpSeries[avgLcpSeries.length-1] || 0;
	const prevDay = avgLcpSeries[avgLcpSeries.length-2] || 0;
	const delta = prevDay? Math.round(((lastDay-prevDay)/prevDay)*100): 0;
	const allCls = globalSeries.map(s=> s.cls).filter(Boolean);
	const clsP75 = percentile(allCls,75);
	const allInp = globalSeries.map(s=> s.inp).filter(Boolean);
	const inpP75 = percentile(allInp,75);
		// Rankings p75 por página
		const perPathP75 = vitals.map(v=>{
			const lcpP75 = percentile(v.series.map(s=> s.lcp).filter(Boolean), 75);
			const inpP75 = percentile(v.series.map(s=> s.inp).filter(Boolean), 75);
			const clsP75 = percentile(v.series.map(s=> s.cls).filter(Boolean), 75);
			return { path:v.path, lcpP75, inpP75, clsP75 };
		});
		const worstLcp = [...perPathP75].sort((a,b)=> b.lcpP75 - a.lcpP75).slice(0,5);
		const worstInp = [...perPathP75].sort((a,b)=> b.inpP75 - a.inpP75).slice(0,5);
		const worstCls = [...perPathP75].sort((a,b)=> b.clsP75 - a.clsP75).slice(0,5);
		const alerts = {
			lcp: perPathP75.filter(p=> p.lcpP75>2500).length,
			inp: perPathP75.filter(p=> p.inpP75>200).length,
			cls: perPathP75.filter(p=> p.clsP75>0.1).length,
		};
		return (
			<>
				<Header />
				<Main>
					<div className="space-y-10">
						<header className="space-y-1">
							<h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
							<p className="text-sm text-[var(--text-muted)]">Web Vitals e interações – últimos 14 dias.</p>
						</header>
						<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
							<MetricCard title="LCP Médio" value={lastDay+'ms'} hint={delta? `Δ ${delta}% vs dia anterior`:''}>
								<div className="mt-2"><Sparkline points={avgLcpSeries} height={32} /></div>
							</MetricCard>
							<MetricCard title="CLS p75" value={clsP75} hint="Objetivo <0.1" />
							<MetricCard title="INP p75" value={inpP75+'ms'} hint="Objetivo <200ms" />
							<MetricCard title="Páginas" value={vitals.length} hint="Com vitals recentes" />
						</section>
						<section className="grid gap-4 md:grid-cols-2">
							<ChartCard title="LCP (14d)" type="line" labels={days} datasets={[{label:'LCP', data: avgLcpSeries, borderColor:'var(--accent)', backgroundColor:'var(--accent)'}]} description="Média diária (lazy-loaded)" tooltip="Linha representa média diária agregada de LCP em ms" />
							<div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
								<h2 className="mb-2 text-sm font-semibold tracking-wide">Alertas</h2>
								<ul className="text-[13px] text-[var(--text-muted)] space-y-1">
									<li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" />LCP fora da meta (&gt;2.5s): <span className="font-medium text-[var(--text)]">{alerts.lcp}</span></li>
									<li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" />INP fora da meta (&gt;200ms): <span className="font-medium text-[var(--text)]">{alerts.inp}</span></li>
									<li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" />CLS fora da meta (&gt;0.1): <span className="font-medium text-[var(--text)]">{alerts.cls}</span></li>
								</ul>
							</div>
						</section>
						<LazyReveal className="space-y-6">
							<h2 className="text-sm font-semibold tracking-wide">Detalhe por página</h2>
							<div className="grid gap-6 md:grid-cols-2">
							{vitals.map(v=> (
								<div key={v.path} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
									<div className="mb-2 truncate text-sm font-medium" title={v.path}>{v.path}</div>
									<div className="space-y-1 text-[10px] text-[var(--text-muted)]">
										{v.series.map(s=> <div key={s.day} className="flex items-center justify-between gap-2">
											<span className="w-16 truncate">{s.day.slice(5)}</span>
											<Bar label="LCP" value={s.lcp} max={8000} good={2500} warn={4000} />
											<Bar label="INP" value={s.inp} max={800} good={200} warn={500} />
											<Bar label="CLS" value={s.cls} max={0.6} good={0.1} warn={0.25} />
										</div>)}
									</div>
								</div>
							))}
							</div>
						</LazyReveal>
						<LazyReveal className="grid gap-6 md:grid-cols-3">
							<div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
								<h2 className="mb-2 text-sm font-semibold tracking-wide">Ranking LCP (p75)</h2>
								<ol className="space-y-1 text-[12px]">
									{worstLcp.map(r=> <li key={r.path} className="flex items-center justify-between gap-2"><span className="min-w-0 truncate" title={r.path}>{r.path}</span><Badge value={r.lcpP75} warn={2500} alert={4000} suffix="ms" /></li>)}
								</ol>
							</div>
							<div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
								<h2 className="mb-2 text-sm font-semibold tracking-wide">Ranking INP (p75)</h2>
								<ol className="space-y-1 text-[12px]">
									{worstInp.map(r=> <li key={r.path} className="flex items-center justify-between gap-2"><span className="min-w-0 truncate" title={r.path}>{r.path}</span><Badge value={r.inpP75} warn={200} alert={500} suffix="ms" /></li>)}
								</ol>
							</div>
							<div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
								<h2 className="mb-2 text-sm font-semibold tracking-wide">Ranking CLS (p75)</h2>
								<ol className="space-y-1 text-[12px]">
									{worstCls.map(r=> <li key={r.path} className="flex items-center justify-between gap-2"><span className="min-w-0 truncate" title={r.path}>{r.path}</span><Badge value={r.clsP75} warn={0.1} alert={0.25} /></li>)}
								</ol>
							</div>
						</LazyReveal>
						<section className="space-y-4">
							<h2 className="text-sm font-semibold tracking-wide">Interações (CTR aproximado)</h2>
							<div className="grid gap-4 md:grid-cols-2">
							{ctr.map(c=> (
								<div key={c.path} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[11px]">
									<div className="mb-1 truncate font-medium text-[var(--text)]" title={c.path}>{c.path}</div>
									<div className="flex flex-wrap gap-2">
										{events.map(e=> <span key={e} className="rounded bg-[var(--surface-2)] px-2 py-0.5">{e}:{c.counts[e]} ({c.ratios[e]}%)</span>)}
									</div>
								</div>
							))}
							</div>
						</section>
						{contrastAlert && (
						<section className="space-y-2">
							<h2 className="text-sm font-semibold tracking-wide">Relatório de contraste</h2>
							<pre className="max-h-64 overflow-auto rounded border bg-[var(--surface-2)] p-3 text-[10px] leading-snug whitespace-pre-wrap">{contrastAlert}</pre>
						</section>
						)}
					</div>
				</Main>
			</>
		);
}

function Bar({ label, value, max, good, warn }:{ label:string; value:number; max:number; good:number; warn:number }){
	let color='bg-emerald-600';
	if(value>warn) color='bg-red-600'; else if(value>good) color='bg-amber-600';
	const pct=Math.min(100,(value/max)*100);
	return <div className="flex flex-1 items-center gap-1"><span className="w-6 text-right">{label}</span><div className="h-2 flex-1 overflow-hidden rounded bg-[var(--surface-2)]"><div className={`h-full ${color}`} style={{width:pct+'%'}}/></div><span className="w-10 tabular-nums text-right">{value}</span></div>;
}

function percentile(arr:number[], p:number){ if(!arr.length) return 0; const sorted=[...arr].sort((a,b)=>a-b); const idx=Math.min(sorted.length-1, Math.floor((p/100)*sorted.length)); return sorted[idx]; }

function Badge({ value, warn, alert, suffix='' }:{ value:number; warn:number; alert:number; suffix?:string }){
	let cls='bg-emerald-600 text-white';
	if(value>alert) cls='bg-red-600 text-white'; else if(value>warn) cls='bg-amber-600 text-black';
	return <span className={`inline-flex min-w-12 items-center justify-center rounded-full px-2 py-0.5 text-[11px] ${cls}`}><span className="tabular-nums">{value}{suffix}</span></span>;
}
