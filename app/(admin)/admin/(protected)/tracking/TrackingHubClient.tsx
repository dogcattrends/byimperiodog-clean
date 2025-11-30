"use client";
import React from "react";
import { PixelsForm } from "./components/PixelsForm";

type ProviderKey = "facebook" | "google_analytics" | "google_tag_manager" | "tiktok";

type NormalizedResource = { id: string; name: string; extra?: Record<string, any> };

export type PixelsFormValues = import("./components/schema").PixelsFormValues;

export interface TrackingHubClientProps {
  initialPixels: PixelsFormValues;
  pixelsUpdatedAt: string | null;
  initialTrackingSettings: {
    facebook_pixel_id?: string | null;
    ga_measurement_id?: string | null;
    gtm_container_id?: string | null;
    tiktok_pixel_id?: string | null;
  };
  initialIntegrations: Record<ProviderKey, boolean>; // connected status
}

export function TrackingHubClient({
  initialPixels,
  pixelsUpdatedAt,
  initialTrackingSettings,
  initialIntegrations,
}: TrackingHubClientProps) {
  const [trackingSettings, setTrackingSettings] = React.useState(initialTrackingSettings);
  const [integrations, setIntegrations] = React.useState<Record<ProviderKey, boolean>>(initialIntegrations);
  const [message, setMessage] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState<ProviderKey | null>(null);
  const [loadingIntegrations, setLoadingIntegrations] = React.useState(false);

  // Refresh integrations & tracking settings after actions
  async function refreshState() {
    try {
      setLoadingIntegrations(true);
      const integResp = await fetch("/api/integrations/list", { credentials: "include" });
      if (integResp.ok) {
        const list = (await integResp.json()) as Array<{ provider: ProviderKey; connected: boolean }>;
        const map: Record<ProviderKey, boolean> = {
          facebook: false,
          google_analytics: false,
          google_tag_manager: false,
          tiktok: false,
        };
        list.forEach((i) => { map[i.provider] = i.connected; });
        setIntegrations(map);
      }
      const trackResp = await fetch("/api/tracking/settings", { credentials: "include" });
      if (trackResp.ok) {
        setTrackingSettings(await trackResp.json());
      }
    } catch (e: any) {
      setMessage(e?.message || String(e));
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
        setMessage("Nenhum recurso encontrado para este provedor.");
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
      setMessage(`Sincronizado: ${provider} → ${picked.name}`);
    } catch (e: any) {
      setMessage(e?.message || String(e));
    } finally {
      setSyncing(null);
      refreshState();
    }
  }

  function sendTestEvent(provider: ProviderKey) {
    try {
      if (typeof window === "undefined") return;
      switch (provider) {
        case "facebook": {
          const fbq = (window as any).fbq; if (typeof fbq === "function") { fbq("track", "TestEvent", { source: "AdminPanel" }); setMessage("Facebook: TestEvent enviado."); } else { throw new Error("fbq indisponivel"); }
          break;
        }
        case "google_analytics": {
          const gtag = (window as any).gtag; if (typeof gtag === "function") { gtag("event", "test_event", { source: "AdminPanel" }); setMessage("GA: test_event enviado."); } else { throw new Error("gtag indisponivel"); }
          break;
        }
        case "tiktok": {
          const ttq = (window as any).ttq; if (ttq && typeof ttq.track === "function") { ttq.track("TestEvent", { source: "AdminPanel" }); setMessage("TikTok: TestEvent enviado."); } else { throw new Error("ttq.track indisponivel"); }
          break;
        }
        default:
          setMessage("Provedor sem evento de teste.");
      }
    } catch (e: any) {
      setMessage(e?.message || String(e));
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
          <h2 className="text-xl font-semibold">Integracoes & Auto-configuracao</h2>
          <button
            type="button"
            onClick={refreshState}
            disabled={loadingIntegrations}
            className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-[var(--surface-2)]"
          >
            Atualizar estado
          </button>
        </div>
        {message && <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{message}</div>}
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
                        className="rounded-md bg-gray-800 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700"
                      >Send Test Event</button>
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
