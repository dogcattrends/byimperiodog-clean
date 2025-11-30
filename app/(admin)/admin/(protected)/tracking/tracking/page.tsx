import { getPixelsSettings } from "@/lib/pixels";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Server component: carrega dados iniciais e renderiza o Hub unificado
export default async function Page() {
  const userId = resolveUserId();
  const pixelsSettings = await getPixelsSettings();
  const formValues = toFormValues(pixelsSettings);
  const trackingSettings = await getInitialTrackingSettings(userId);
  const integrationsStatus = await getIntegrationsStatus(userId);

  return (
    <div className="space-y-10 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Tracking & Pixels Hub</h1>
        <p className="text-sm text-[var(--text-muted)] max-w-2xl">
          Página canônica para configurar IDs de pixels, consentimento e integrações OAuth de provedores de rastreamento. Conecte contas e auto-configure identificadores quando disponível.
        </p>
      </header>
      <TrackingHubClient
        initialPixels={formValues}
        pixelsUpdatedAt={pixelsSettings.updated_at}
        initialTrackingSettings={trackingSettings as any}
        initialIntegrations={integrationsStatus}
      />
    </div>
  );
}

function resolveUserId() {
  const envUser = (process.env.ADMIN_USER_ID || process.env.DEFAULT_ADMIN_USER_ID || "").trim();
  return envUser || "admin";
}

async function getInitialTrackingSettings(userId: string) {
  try {
    const supa = supabaseAdmin();
    const { data } = await supa
      .from("tracking_settings")
      .select("facebook_pixel_id,ga_measurement_id,gtm_container_id,tiktok_pixel_id")
      .eq("user_id", userId)
      .maybeSingle();
    return data || {};
  } catch {
    return {};
  }
}

async function getIntegrationsStatus(userId: string) {
  try {
    const supa = supabaseAdmin();
    const { data } = await supa
      .from("integrations")
      .select("provider,access_token")
      .eq("user_id", userId);
    const status: Record<"facebook"|"google_analytics"|"google_tag_manager"|"tiktok", boolean> = {
      facebook: false,
      google_analytics: false,
      google_tag_manager: false,
      tiktok: false,
    };
    (data || []).forEach((row: any) => {
      const p = row.provider as keyof typeof status;
      if (p in status) status[p] = !!row.access_token;
    });
    return status;
  } catch {
    return { facebook: false, google_analytics: false, google_tag_manager: false, tiktok: false };
  }
}

function toFormValues(settings: Awaited<ReturnType<typeof getPixelsSettings>>) {
  const envToForm = (env: any) => ({
    gtmId: env.gtmId || "",
    ga4Id: env.ga4Id || "",
    metaPixelId: env.metaPixelId || "",
    tiktokPixelId: env.tiktokPixelId || "",
    googleAdsId: env.googleAdsId || "",
    googleAdsConversionLabel: env.googleAdsConversionLabel || "",
    pinterestId: env.pinterestId || "",
    hotjarId: env.hotjarId || "",
    clarityId: env.clarityId || "",
    metaDomainVerification: env.metaDomainVerification || "",
    analyticsConsent: !!env.analyticsConsent,
    marketingConsent: !!env.marketingConsent,
  });
  return {
    production: envToForm(settings.production),
    staging: envToForm(settings.staging),
  };
}

// Client-side Hub combinado num único arquivo para a rota canônica
// Reusa PixelsForm e adiciona seções: Conexões, Tags ativas, Test
"use client";
import React from "react";
import { PixelsForm } from "@/app/(admin)/admin/(protected)/pixels/PixelsForm";

type ProviderKey = "facebook" | "google_analytics" | "google_tag_manager" | "tiktok";
type NormalizedResource = { id: string; name: string; extra?: Record<string, any> };
export type PixelsFormValues = import("@/app/(admin)/admin/(protected)/pixels/schema").PixelsFormValues;

function TrackingHubClient({
  initialPixels,
  pixelsUpdatedAt,
  initialTrackingSettings,
  initialIntegrations,
}: {
  initialPixels: PixelsFormValues;
  pixelsUpdatedAt: string | null;
  initialTrackingSettings: {
    facebook_pixel_id?: string | null;
    ga_measurement_id?: string | null;
    gtm_container_id?: string | null;
    tiktok_pixel_id?: string | null;
  };
  initialIntegrations: Record<ProviderKey, boolean>;
}) {
  const [trackingSettings, setTrackingSettings] = React.useState(initialTrackingSettings);
  const [integrations, setIntegrations] = React.useState<Record<ProviderKey, boolean>>(initialIntegrations);
  const [message, setMessage] = React.useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [syncing, setSyncing] = React.useState<ProviderKey | null>(null);
  const [loadingIntegrations, setLoadingIntegrations] = React.useState(false);
  const [testingProvider, setTestingProvider] = React.useState<ProviderKey | null>(null);

  async function refreshState() {
    try {
      setLoadingIntegrations(true);
      setMessage(null);
      const integResp = await fetch("/api/integrations/list", { credentials: "include" });
      if (!integResp.ok) throw new Error(`Erro ao carregar integracoes: ${integResp.status}`);
      const list = (await integResp.json()) as Array<{ provider: ProviderKey; connected: boolean }>;
      const map: Record<ProviderKey, boolean> = {
        facebook: false,
        google_analytics: false,
        google_tag_manager: false,
        tiktok: false,
      };
      list.forEach((i) => { map[i.provider] = i.connected; });
      setIntegrations(map);
      const trackResp = await fetch("/api/tracking/settings", { credentials: "include" });
      if (trackResp.ok) {
        setTrackingSettings(await trackResp.json());
      }
      setMessage({ type: "success", text: "Estado atualizado com sucesso." });
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || String(e) });
    } finally {
      setLoadingIntegrations(false);
    }
  }

  async function handleConnect(provider: ProviderKey) {
    window.location.href = `/api/integrations/${provider}/login`;
  }

  async function handleSync(provider: ProviderKey) {
    try {
      setSyncing(provider);
      setMessage(null);
      const res = await fetch(`/api/integrations/${provider}/resources`, { credentials: "include" });
      if (!res.ok) throw new Error(`Falha ao obter recursos (${res.status}).`);
      const resources = (await res.json()) as NormalizedResource[];
      if (!resources || resources.length === 0) {
        setMessage({ type: "info", text: `Nenhum recurso encontrado para ${provider.replace(/_/g, " ")}.` });
        return;
      }
      const picked = resources[0];
      const sel = await fetch(`/api/tracking/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, resourceId: picked.id }),
        credentials: "include",
      });
      if (!sel.ok) throw new Error(`Falha ao salvar selecao (${sel.status}).`);
      const updated = await sel.json();
      setTrackingSettings(updated);
      setMessage({ type: "success", text: `✓ Sincronizado: ${provider.replace(/_/g, " ")} → ${picked.name}` });
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || String(e) });
    } finally {
      setSyncing(null);
      await refreshState();
    }
  }

  function sendTestEvent(provider: ProviderKey) {
    try {
      if (typeof window === "undefined") return;
      setTestingProvider(provider);
      setMessage(null);
      switch (provider) {
        case "facebook": {
          const fbq = (window as any).fbq; 
          if (typeof fbq === "function") { 
            fbq("track", "TestEvent", { source: "AdminPanel" }); 
            setMessage({ type: "success", text: "✓ Facebook TestEvent enviado. Verifique no Events Manager." });
          } else { 
            throw new Error("Facebook Pixel (fbq) não está carregado na página."); 
          }
          break;
        }
        case "google_analytics": {
          const gtag = (window as any).gtag; 
          if (typeof gtag === "function") { 
            gtag("event", "test_event", { source: "AdminPanel" }); 
            setMessage({ type: "success", text: "✓ Google Analytics test_event enviado. Verifique no DebugView." });
          } else { 
            throw new Error("Google Analytics (gtag) não está carregado na página."); 
          }
          break;
        }
        case "tiktok": {
          const ttq = (window as any).ttq; 
          if (ttq && typeof ttq.track === "function") { 
            ttq.track("TestEvent", { source: "AdminPanel" }); 
            setMessage({ type: "success", text: "✓ TikTok TestEvent enviado. Verifique no Events Manager." });
          } else { 
            throw new Error("TikTok Pixel (ttq) não está carregado na página."); 
          }
          break;
        }
        default:
          setMessage({ type: "info", text: "Este provedor não suporta eventos de teste." });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || String(e) });
    } finally {
      setTimeout(() => setTestingProvider(null), 800);
    }
  }

  const providers: ProviderKey[] = ["facebook", "google_analytics", "google_tag_manager", "tiktok"];

  function renderSelectedId(p: ProviderKey) {
    switch (p) {
      case "facebook": return trackingSettings.facebook_pixel_id || "—";
      case "google_analytics": return trackingSettings.ga_measurement_id || "—";
      case "google_tag_manager": return trackingSettings.gtm_container_id || "—";
      case "tiktok": return trackingSettings.tiktok_pixel_id || "—";
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Configuracao de Pixels & Consentimento</h2>
        <PixelsForm initialValues={initialPixels} updatedAt={pixelsUpdatedAt} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Conexoes (OAuth) & Auto-configuracao</h2>
          <button
            type="button"
            onClick={refreshState}
            disabled={loadingIntegrations}
            className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-[var(--surface-2)]"
          >
            Atualizar estado
          </button>
        </div>
        {message && (
          <div className={`rounded-md border px-3 py-2 text-sm ${
            message.type === "success" ? "border-green-200 bg-green-50 text-green-700" :
            message.type === "error" ? "border-red-200 bg-red-50 text-red-700" :
            "border-blue-200 bg-blue-50 text-blue-700"
          }`}>
            {message.text}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((p) => {
            const connected = integrations[p];
            return (
              <div key={p} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold capitalize">{p.replace(/_/g, " ")}</h3>
                  <span className={`text-xs font-medium ${connected ? "text-green-600" : "text-red-600"}`}>{connected ? "Conectado" : "Nao conectado"}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">Selecionado: <span className="font-mono">{renderSelectedId(p)}</span></p>
                {!connected ? (
                  <button
                    onClick={() => handleConnect(p)}
                    className="w-full rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                  >Conectar via OAuth</button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSync(p)}
                      disabled={syncing === p}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                    >{syncing === p ? "Sincronizando..." : "Sync & Auto-configure"}</button>
                    {(p === "facebook" || p === "google_analytics" || p === "tiktok") && (
                      <button
                        onClick={() => sendTestEvent(p)}
                        disabled={testingProvider === p}
                        className="rounded-md bg-gray-800 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-60"
                      >{testingProvider === p ? "Testando..." : "Testar"}</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
