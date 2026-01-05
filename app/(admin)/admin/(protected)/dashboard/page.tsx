import type { Metadata } from "next";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTrackingConfig, type TrackingConfig } from "@/lib/tracking/getTrackingConfig";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
  robots: { index: false, follow: false },
};

type LeadRow = {
  created_at: string;
  status?: string | null;
};

type PuppyRow = {
  status?: string | null;
  price_cents?: number | null;
  midia?: unknown;
  media?: unknown;
  images?: unknown;
  cover_url?: string | null;
  image_url?: string | null;
};

type DashboardSnapshot = {
  leadsToday: number;
  leadsNoResponse: number;
  puppiesAvailable: number;
  puppiesReserved: number;
  puppiesNoPrice: number;
  puppiesNoPhoto: number;
};

function startOfDayIso(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function normalizePuppyStatus(status?: string | null) {
  if (!status) return "available";
  const value = status.toLowerCase();
  if (value === "disponivel" || value === "available") return "available";
  if (value === "reservado" || value === "reserved") return "reserved";
  if (value === "vendido" || value === "sold") return "sold";
  if (value === "indisponivel" || value === "unavailable") return "unavailable";
  if (value === "em_breve" || value === "embreve" || value === "pending") return "pending";
  return "available";
}

function hasMedia(value: unknown): boolean {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "object") {
    const obj = value as { url?: unknown; src?: unknown };
    if (typeof obj.url === "string" && obj.url.trim().length > 0) return true;
    if (typeof obj.src === "string" && obj.src.trim().length > 0) return true;
  }
  return false;
}

async function fetchSnapshot(): Promise<DashboardSnapshot> {
  const sb = supabaseAdmin();
  const startToday = startOfDayIso(new Date());

  const [{ data: leads, error: leadsError }, { data: puppies, error: puppiesError }] = await Promise.all([
    sb.from("leads").select("created_at,status").gte("created_at", startOfDayIso(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30))),
    sb.from("puppies").select("status,price_cents,midia,media,cover_url"),
  ]);

  if (leadsError) throw new Error(`Falha ao carregar leads: ${leadsError.message}`);
  if (puppiesError) throw new Error(`Falha ao carregar filhotes: ${puppiesError.message}`);

  const leadsArr = (leads ?? []) as LeadRow[];
  const puppiesArr = (puppies ?? []) as PuppyRow[];

  const leadsToday = leadsArr.filter((l) => l.created_at >= startToday).length;
  const leadsNoResponse = leadsArr.filter((l) => !l.status || l.status === "novo").length;

  const puppiesAvailable = puppiesArr.filter((p) => normalizePuppyStatus(p.status) === "available").length;
  const puppiesReserved = puppiesArr.filter((p) => normalizePuppyStatus(p.status) === "reserved").length;
  const puppiesNoPrice = puppiesArr.filter((p) => !p.price_cents || p.price_cents <= 0).length;
  const puppiesNoPhoto = puppiesArr.filter(
    (p) => !hasMedia(p.midia) && !hasMedia(p.media) && !hasMedia(p.cover_url) && !hasMedia(p.image_url),
  ).length;

  return {
    leadsToday,
    leadsNoResponse,
    puppiesAvailable,
    puppiesReserved,
    puppiesNoPrice,
    puppiesNoPhoto,
  };
}

export default async function DashboardPage() {
  // fetch snapshot + health in parallel
  let snapshot: DashboardSnapshot | null = null;
  type Health = Record<string, { status?: string } | undefined> | null;
  let health: Health = null;
  let error: string | null = null;
  let dashboardTracking: TrackingConfig | null = null;

  try {
    const [snap, h, tracking] = await Promise.all([
      fetchSnapshot(),
      (async () => {
        try {
          const res = await fetch('/api/admin/system/health');
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      })(),
      // carregar configuração de pixels para exibir status rápidos no dashboard
      getTrackingConfig(),
    ]);
    snapshot = snap;
    health = h as Health;
    dashboardTracking = tracking as TrackingConfig;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Nao foi possivel carregar os KPIs.';
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">Cockpit de vendas</h1>
          <p className="text-sm text-[var(--text-muted)]">KPIs acionáveis e visão operacional — foco em ações.</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/filhotes/novo" className="rounded-full bg-emerald-600 px-3 py-1 text-sm font-semibold text-white">Novo filhote</a>
          <a href="/admin/filhotes" className="rounded-full border px-3 py-1 text-sm font-semibold">Ver estoque</a>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700" role="alert">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Painel operacional resumido">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" role="region" aria-labelledby="health-heading">
          <h2 id="health-heading" className="text-lg font-semibold">Saúde do sistema</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Sanity, Supabase, OpenAI e Webhooks</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Sanity</span>
              <span className="text-xs text-[var(--text-muted)]">{health?.sanity?.status ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Supabase</span>
              <span className="text-xs text-[var(--text-muted)]">{health?.supabase?.status ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>OpenAI</span>
              <span className="text-xs text-[var(--text-muted)]">{health?.openai?.status ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Webhooks</span>
              <span className="text-xs text-[var(--text-muted)]">{health?.webhooks?.status ?? '—'}</span>
            </div>
          </div>
          <div className="mt-4">
            <a href="/admin/system/health" className="text-xs font-semibold text-emerald-700">Ver mais</a>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" role="region" aria-labelledby="pixels-heading">
          <h2 id="pixels-heading" className="text-lg font-semibold">Pixels / Tracking</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Status rápido de tags e pixels</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>GTM</span>
              <span className="text-xs text-[var(--text-muted)]" role="status" aria-live="polite" aria-atomic="true">{dashboardTracking?.isGTMEnabled ? (dashboardTracking.gtmContainerId ?? 'Ativado') : 'Desativado'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>GA4</span>
              <span className="text-xs text-[var(--text-muted)]" role="status" aria-live="polite" aria-atomic="true">{dashboardTracking?.isGAEnabled ? (dashboardTracking.gaMeasurementId ?? 'Ativado') : 'Desativado'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Facebook</span>
              <span className="text-xs text-[var(--text-muted)]" role="status" aria-live="polite" aria-atomic="true">{dashboardTracking?.isFacebookEnabled ? (dashboardTracking.facebookPixelId ?? 'Ativado') : 'Desativado'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>TikTok</span>
              <span className="text-xs text-[var(--text-muted)]" role="status" aria-live="polite" aria-atomic="true">{dashboardTracking?.isTikTokEnabled ? (dashboardTracking.tiktokPixelId ?? 'Ativado') : 'Desativado'}</span>
            </div>
          </div>
          <div className="mt-4">
            <a href="/admin/config/tracking" className="text-xs font-semibold text-emerald-700">Configurar pixels</a>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" role="region" aria-labelledby="funnel-heading">
          <h2 id="funnel-heading" className="text-lg font-semibold">Funil</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Leads e ações urgentes</p>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span>Leads hoje</span>
              <strong className="text-xl" aria-live="polite" aria-atomic="true">{snapshot?.leadsToday ?? '—'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Leads sem resposta</span>
              <strong className="text-xl" aria-live="polite" aria-atomic="true">{snapshot?.leadsNoResponse ?? '—'}</strong>
            </div>
            <div>
              <a href="/admin/leads" className="text-xs font-semibold text-emerald-700">Ver detalhes</a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" role="region" aria-labelledby="inventory-heading">
          <h2 id="inventory-heading" className="text-lg font-semibold">Estoque</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Disponíveis / Reservados / Pendências</p>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span>Disponíveis</span>
              <strong className="text-xl" aria-live="polite" aria-atomic="true">{snapshot?.puppiesAvailable ?? '—'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Reservados</span>
              <strong className="text-xl" aria-live="polite" aria-atomic="true">{snapshot?.puppiesReserved ?? '—'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Pendências (preço/foto)</span>
              <strong className="text-xl" aria-live="polite" aria-atomic="true">{(snapshot?.puppiesNoPrice ?? 0) + (snapshot?.puppiesNoPhoto ?? 0)}</strong>
            </div>
            <div>
              <a href="/admin/filhotes" className="text-xs font-semibold text-emerald-700">Ver estoque</a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
// Intentional: ActionCard/TaskCard/QuickAction removed (unused)
