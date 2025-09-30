import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { computeCoverage } from '@/lib/topicClusters';

// Cache em memória (process local) para reduzir hits repetidos rápidos
interface CacheEntry { ts:number; data:any }
const TTL_MS = 10_000; // 10s
let _cache: CacheEntry | null = null;

// Tipos mínimos para linhas do Supabase usadas aqui
type LeadRow = { id: string; created_at: string; utm_source?: string | null; source?: string | null; status?: string | null };
type ContractRow = { id: string; status?: string | null; created_at: string };
type PuppyRow = { id: string; status?: string | null };
type PostRow = { id: string; slug: string; title: string; status: string; created_at: string | null; published_at: string | null };

// Lightweight metrics endpoint polled pelo dashboard (quase real-time)
export async function GET(req:NextRequest){
  const auth = requireAdmin(req); if(auth) return auth; // early return se não autorizado
  const now = Date.now();
  if(_cache && (now - _cache.ts) < TTL_MS){
    return NextResponse.json(_cache.data);
  }
  const url = new URL(req.url);
  const rangeParam = url.searchParams.get('range');
  const range = ['7','30','90'].includes(String(rangeParam)) ? Number(rangeParam) : 30;
  const supa = supabaseAdmin();
  const end = new Date();
  const start = new Date(); start.setDate(end.getDate()-range);
  const dKey = (d:Date)=> d.toISOString().slice(0,10);

  // Leads
  const { data: leads, error: eLeads } = await supa
    .from('leads')
    .select('id,created_at,utm_source,source,status')
    .gte('created_at', start.toISOString());
  if(eLeads) return NextResponse.json({ ok:false, error:eLeads.message },{ status:500 });

  const byDay = new Map<string,number>();
  const bySource = new Map<string,number>();
  const todayKey = dKey(end);
  let leadsHoje=0;
  ((leads||[]) as LeadRow[]).forEach((l)=> {
    const k = dKey(new Date(l.created_at));
    byDay.set(k,(byDay.get(k)||0)+1);
    const src = (l.utm_source || l.source || 'direct').toLowerCase();
    bySource.set(src,(bySource.get(src)||0)+1);
    if(k===todayKey) leadsHoje++;
  });
  const seriesDays = Math.min(30, range); // para sparkline maior (até 30)
  const series:number[] = [];
  for(let i=seriesDays-1;i>=0;i--){ const d=new Date(); d.setDate(end.getDate()-i); series.push(byDay.get(dKey(d))||0); }

  // Contratos
  const { data: contracts } = await supa
    .from('contracts')
    .select('id,status,created_at')
    .gte('created_at', start.toISOString());
  const conversao = (leads?.length||0) > 0 ? Math.round((((contracts as ContractRow[] | null)?.length||0)/((leads as LeadRow[] | null)?.length||1))*100):0;

  // Puppies status
  const { data: puppies } = await supa.from('puppies').select('id,status');
  const pupStatus = ((puppies||[]) as PuppyRow[]).reduce<Record<string,number>>((acc, p) => {
    const s = (p.status||'desconhecido').toLowerCase();
    acc[s] = (acc[s]||0)+1;
    return acc;
  }, {} as Record<string, number>);

  // Recentes (leads)
  const { data: recent } = await supa
    .from('leads')
    .select('id,created_at,utm_source,source,status')
    .order('created_at',{ ascending:false })
    .limit(12);

  // Posts (para métricas blog & cobertura)
  const { data: posts } = await supa
    .from('blog_posts')
    .select('id,slug,title,status,created_at,published_at')
    .order('created_at',{ ascending:false })
    .limit(2000);
  const postsArr = ((posts||[]) as PostRow[]);
  const publishedPosts = postsArr.filter((p)=> p.status==='published');
  // Série de publicações últimos 30 dias
  const pubSeries:number[] = [];
  for(let i=29;i>=0;i--){ const d=new Date(); d.setDate(end.getDate()-i); const key=dKey(d); pubSeries.push(publishedPosts.filter((p)=> p.published_at && p.published_at.slice(0,10)===key).length); }
  // Cobertura (usa tópico clusters via computeCoverage)
  const coverage = computeCoverage(postsArr.map((p)=> ({ slug:p.slug, title:p.title, status:p.status })));

  // Lista curta de posts recentes para dashboard
  const latestPosts = postsArr
    .slice(0,50) // safety cap
    .sort((a: PostRow, b: PostRow)=> new Date(b.created_at||0).getTime()-new Date(a.created_at||0).getTime())
    .slice(0,8)
    .map((p: PostRow)=> ({ id:p.id, slug:p.slug, title:p.title, status:p.status, published_at:p.published_at }));

  // CTR (eventos de interação / page views) últimos 7 dias
  const pvStart = new Date(); pvStart.setDate(end.getDate()-7);
  const eventsNames = ['card_click','toc_click','share_click'];
  const { count: pageViewsCount } = await supa
    .from('analytics_events')
    .select('*',{ count:'exact', head:true })
    .gte('ts', pvStart.toISOString())
    .eq('name','web_vitals_lcp');
  const { count: interactionsCount } = await supa
    .from('analytics_events')
    .select('*',{ count:'exact', head:true })
    .gte('ts', pvStart.toISOString())
    .in('name', eventsNames as any);
  const ctrRatio = Math.round(((interactionsCount||0)/Math.max(1,(pageViewsCount||0)))*100);

  // Cálculos extras
  const leadsCount = leads?.length||0;
  const mediaDia = Math.round(series.reduce((a,b)=>a+b,0)/Math.max(1,series.length));
  const ontemKeyDate = new Date(); ontemKeyDate.setDate(end.getDate()-1); const ontemKey = dKey(ontemKeyDate);
  const leadsOntem = byDay.get(ontemKey)||0; const deltaHoje = leadsOntem>0? Math.round(((leadsHoje-leadsOntem)/leadsOntem)*100): (leadsHoje>0? 100:0);
  const topFontes = [...bySource.entries()].sort((a,b)=> b[1]-a[1]).slice(0,6).map(([src,count])=> ({ src, count, pct: leadsCount? Math.round((count/leadsCount)*100):0 }));

  const payload = {
    ok:true,
    range,
    // Leads
    leadsHoje, deltaHoje, leadsCount, conversao, series, mediaDia, topFontes, recent,
    // Puppies
    pupStatus, contratos: contracts?.length||0,
    // Blog
    postsCount: posts?.length||0,
    postsPublished: publishedPosts.length,
    publishSeries: pubSeries,
    coverage: { percent: coverage.percent, covered: coverage.covered, total: coverage.total, missingCount: coverage.missing.length },
    latestPosts,
    // CTR
    ctr: { ratio: ctrRatio, interactions: interactionsCount||0, pageViews: pageViewsCount||0 }
  };
  _cache = { ts: now, data: payload };
  return NextResponse.json(payload);
}
