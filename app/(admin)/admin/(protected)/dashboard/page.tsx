import type { Metadata } from "next";

import { cn } from "@/lib/cn";
import { shouldPreferPuppiesV2FromEnv, withPuppiesReadTable } from "@/lib/puppies/readTable";
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
  price?: number | null;
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

  const [{ data: leads, error: leadsError }, puppiesRes] = await Promise.all([
    sb.from("leads").select("created_at,status").gte("created_at", startOfDayIso(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30))),
    withPuppiesReadTable({
      sb,
      preferV2: shouldPreferPuppiesV2FromEnv("PUPPIES_ADMIN_READ_SOURCE"),
      query: (table) => {
        const select =
          table === "puppies_v2"
            ? "status,price,images"
            : "status,price_cents,preco,midia,media,images,cover_url,image_url";
        return (sb as any).from(table).select(select);
      },
    }),
  ]);

  const puppies = (puppiesRes as any).data as unknown;
  const puppiesError = (puppiesRes as any).error as { message?: string } | undefined;

  if (leadsError) throw new Error(`Falha ao carregar leads: ${leadsError.message}`);
  if (puppiesError) throw new Error(`Falha ao carregar filhotes: ${puppiesError.message}`);

  const leadsArr = (leads ?? []) as LeadRow[];
  const puppiesArr = (puppies ?? []) as PuppyRow[];

  const leadsToday = leadsArr.filter((l) => l.created_at >= startToday).length;
  const leadsNoResponse = leadsArr.filter((l) => !l.status || l.status === "novo").length;

  const puppiesAvailable = puppiesArr.filter((p) => normalizePuppyStatus(p.status) === "available").length;
  const puppiesReserved = puppiesArr.filter((p) => normalizePuppyStatus(p.status) === "reserved").length;
  const puppiesNoPrice = puppiesArr.filter((p) => {
    const cents = typeof p.price_cents === "number" ? p.price_cents : typeof p.price === "number" ? p.price : null;
    return !cents || cents <= 0;
  }).length;
  const puppiesNoPhoto = puppiesArr.filter(
    (p) => !hasMedia(p.images) && !hasMedia(p.midia) && !hasMedia(p.media) && !hasMedia(p.cover_url) && !hasMedia(p.image_url),
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
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[rgb(var(--admin-text))]">
            Cockpit de vendas
          </h1>
          <p className="text-sm text-[rgb(var(--admin-text-muted))]">
            KPIs acionáveis e visão operacional — foco em ações.
          </p>
        </div>
        <div className="flex gap-3">
          <a href="/admin/filhotes/novo" className="admin-btn admin-btn-primary">
            + Novo filhote
          </a>
          <a href="/admin/filhotes" className="admin-btn admin-btn-secondary">
            Ver estoque
          </a>
        </div>
      </header>

      {/* Error alert */}
      {error ? (
        <div className="admin-glass-card border-[rgb(var(--admin-danger))] bg-[rgba(239,68,68,0.1)] px-5 py-4" role="alert">
          <p className="text-sm font-medium text-[rgb(var(--admin-danger))]">{error}</p>
        </div>
      ) : null}

      {/* KPI Grid */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="Painel operacional resumido">
        {/* Health Card */}
        <div className="admin-glass-card admin-card-gradient p-6" role="region" aria-labelledby="health-heading">
          <div className="admin-card-header pb-4">
            <div>
              <h2 id="health-heading" className="admin-card-title">Saúde do sistema</h2>
              <p className="admin-card-subtitle">Sanity, Supabase, OpenAI e Webhooks</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Sanity', status: health?.sanity?.status },
              { label: 'Supabase', status: health?.supabase?.status },
              { label: 'OpenAI', status: health?.openai?.status },
              { label: 'Webhooks', status: health?.webhooks?.status },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-[rgb(var(--admin-surface))] px-3 py-2.5">
                <span className="text-sm font-medium text-[rgb(var(--admin-text))]">{label}</span>
                <span className={cn(
                  "admin-status",
                  status === '✅' || status?.toLowerCase().includes('ok') 
                    ? "admin-status-online" 
                    : status === '—' 
                      ? "admin-status-warning" 
                      : "admin-status-offline"
                )}>
                  {status === '✅' ? 'Online' : status === '—' ? 'Checking' : status || 'Offline'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <a href="/admin/system/health" className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--admin-brand-bright))] hover:text-[rgb(var(--admin-brand))]">
              Ver detalhes →
            </a>
          </div>
        </div>

        {/* Tracking Card */}
        <div className="admin-glass-card admin-card-gradient p-6" role="region" aria-labelledby="pixels-heading">
          <div className="admin-card-header pb-4">
            <div>
              <h2 id="pixels-heading" className="admin-card-title">Pixels / Tracking</h2>
              <p className="admin-card-subtitle">Status rápido de tags e pixels</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'GTM', enabled: dashboardTracking?.isGTMEnabled, id: dashboardTracking?.gtmContainerId },
              { label: 'GA4', enabled: dashboardTracking?.isGAEnabled, id: dashboardTracking?.gaMeasurementId },
              { label: 'Facebook', enabled: dashboardTracking?.isFacebookEnabled, id: dashboardTracking?.facebookPixelId },
              { label: 'TikTok', enabled: dashboardTracking?.isTikTokEnabled, id: dashboardTracking?.tiktokPixelId },
            ].map(({ label, enabled, id }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-[rgb(var(--admin-surface))] px-3 py-2.5">
                <span className="text-sm font-medium text-[rgb(var(--admin-text))]">{label}</span>
                <span className={cn(
                  "admin-badge",
                  enabled ? "admin-badge-success" : "admin-badge-warning"
                )} role="status" aria-live="polite" aria-atomic="true">
                  {enabled ? (id ?? 'Ativo') : 'Off'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <a href="/admin/config/tracking" className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--admin-brand-bright))] hover:text-[rgb(var(--admin-brand))]">
              Configurar →
            </a>
          </div>
        </div>

        {/* Funnel Card */}
        <div className="admin-glass-card admin-card-gradient p-6" role="region" aria-labelledby="funnel-heading">
          <div className="admin-card-header pb-4">
            <div>
              <h2 id="funnel-heading" className="admin-card-title">Funil</h2>
              <p className="admin-card-subtitle">Leads e ações urgentes</p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="admin-kpi">
              <span className="admin-kpi-label">Leads hoje</span>
              <strong className="admin-kpi-value" aria-live="polite" aria-atomic="true">
                {snapshot?.leadsToday ?? '—'}
              </strong>
            </div>
            <div className="admin-kpi">
              <span className="admin-kpi-label">Sem resposta</span>
              <strong className="admin-kpi-value" aria-live="polite" aria-atomic="true">
                {snapshot?.leadsNoResponse ?? '—'}
              </strong>
              {snapshot && snapshot.leadsNoResponse > 0 && (
                <span className="admin-badge admin-badge-warning mt-1">Ação necessária</span>
              )}
            </div>
          </div>
          <div className="mt-5">
            <a href="/admin/leads" className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--admin-brand-bright))] hover:text-[rgb(var(--admin-brand))]">
              Ver leads →
            </a>
          </div>
        </div>

        {/* Inventory Card */}
        <div className="admin-glass-card admin-card-gradient p-6" role="region" aria-labelledby="inventory-heading">
          <div className="admin-card-header pb-4">
            <div>
              <h2 id="inventory-heading" className="admin-card-title">Estoque</h2>
              <p className="admin-card-subtitle">Disponíveis / Reservados / Pendências</p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="admin-kpi">
              <span className="admin-kpi-label">Disponíveis</span>
              <strong className="admin-kpi-value" aria-live="polite" aria-atomic="true">
                {snapshot?.puppiesAvailable ?? '—'}
              </strong>
            </div>
            <div className="admin-kpi">
              <span className="admin-kpi-label">Reservados</span>
              <strong className="admin-kpi-value" aria-live="polite" aria-atomic="true">
                {snapshot?.puppiesReserved ?? '—'}
              </strong>
            </div>
            <div className="admin-kpi">
              <span className="admin-kpi-label">Pendências (preço/foto)</span>
              <strong className="admin-kpi-value" aria-live="polite" aria-atomic="true">
                {(snapshot?.puppiesNoPrice ?? 0) + (snapshot?.puppiesNoPhoto ?? 0)}
              </strong>
              {snapshot && ((snapshot.puppiesNoPrice ?? 0) + (snapshot.puppiesNoPhoto ?? 0)) > 0 && (
                <span className="admin-badge admin-badge-danger mt-1">Revisar</span>
              )}
            </div>
          </div>
          <div className="mt-5">
            <a href="/admin/filhotes" className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--admin-brand-bright))] hover:text-[rgb(var(--admin-brand))]">
              Ver estoque →
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
// Intentional: ActionCard/TaskCard/QuickAction removed (unused)
