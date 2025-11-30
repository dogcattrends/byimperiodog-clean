"use client";
import React from "react";

type ProviderKey = "facebook" | "google_analytics" | "google_tag_manager" | "tiktok";

type NormalizedResource = { id: string; name: string; extra?: Record<string, any> };

type Integration = {
  provider: ProviderKey;
  connected: boolean;
};

type TrackingSettings = {
  facebook_pixel_id?: string | null;
  ga_measurement_id?: string | null;
  gtm_container_id?: string | null;
  tiktok_pixel_id?: string | null;
};

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export default function TrackingIntegrationsHubPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState<TrackingSettings | null>(null);
  const [integrations, setIntegrations] = React.useState<Record<ProviderKey, Integration>>({
    facebook: { provider: "facebook", connected: false },
    google_analytics: { provider: "google_analytics", connected: false },
    google_tag_manager: { provider: "google_tag_manager", connected: false },
    tiktok: { provider: "tiktok", connected: false },
  });
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [settingsResp, integrationsResp] = await Promise.all([
          // Ajuste estes endpoints conforme seu projeto
          fetchJSON<TrackingSettings>("/api/tracking/settings"),
          fetchJSON<Array<{ provider: ProviderKey; connected: boolean }>>("/api/integrations/list"),
        ]);
        if (!active) return;
        setSettings(settingsResp || {});
        const integMap: Record<ProviderKey, Integration> = {
          facebook: { provider: "facebook", connected: false },
          google_analytics: { provider: "google_analytics", connected: false },
          google_tag_manager: { provider: "google_tag_manager", connected: false },
          tiktok: { provider: "tiktok", connected: false },
        };
        integrationsResp?.forEach((i) => { integMap[i.provider] = i; });
        setIntegrations(integMap);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function handleConnect(provider: ProviderKey) {
    try {
      setMessage(null);
      window.location.href = `/api/integrations/${provider}/login`;
    } catch (e: any) {
      setMessage(e?.message || String(e));
    }
  }

  async function handleSync(provider: ProviderKey) {
    try {
      setMessage(null);
      const resources = await fetchJSON<NormalizedResource[]>(`/api/integrations/${provider}/resources`);
      if (!resources || resources.length === 0) {
        setMessage("Nenhum recurso encontrado para este provedor.");
        return;
      }
      const picked = resources.length === 1 ? resources[0] : resources[0];
      // POST select
      const res = await fetch(`/api/tracking/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, resourceId: picked.id }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Falha ao salvar seleção: ${res.status} ${txt}`);
      }
      const updated: TrackingSettings = await res.json();
      setSettings(updated);
      setMessage(`Sincronizado: ${provider} → ${picked.name} (${picked.id})`);
    } catch (e: any) {
      setMessage(e?.message || String(e));
    }
  }

  function renderSelectedId(provider: ProviderKey) {
    const s = settings || {};
    switch (provider) {
      case "facebook": return s.facebook_pixel_id || "—";
      case "google_analytics": return s.ga_measurement_id || "—";
      case "google_tag_manager": return s.gtm_container_id || "—";
      case "tiktok": return s.tiktok_pixel_id || "—";
    }
  }

  function sendTestEvent(provider: ProviderKey) {
    try {
      if (typeof window === "undefined") return;
      switch (provider) {
        case "facebook": {
          const fbq = (window as any).fbq; if (typeof fbq === "function") { fbq("track", "TestEvent", { source: "AdminPanel" }); setMessage("Facebook: TestEvent enviado."); } else { throw new Error("fbq indisponível"); }
          break;
        }
        case "google_analytics": {
          const gtag = (window as any).gtag; if (typeof gtag === "function") { gtag("event", "test_event", { source: "AdminPanel" }); setMessage("GA: test_event enviado."); } else { throw new Error("gtag indisponível"); }
          break;
        }
        case "tiktok": {
          const ttq = (window as any).ttq; if (ttq && typeof ttq.track === "function") { ttq.track("TestEvent", { source: "AdminPanel" }); setMessage("TikTok: TestEvent enviado."); } else { throw new Error("ttq.track indisponível"); }
          break;
        }
        default:
          setMessage("Este provedor não suporta eventos de teste.");
      }
    } catch (e: any) {
      setMessage(e?.message || String(e));
    }
  }

  const providers: ProviderKey[] = ["facebook", "google_analytics", "google_tag_manager", "tiktok"];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Tracking & Pixels Integrations Hub</h1>
      {loading && (<div className="text-sm text-gray-500">Carregando…</div>)}
      {error && (<div className="text-sm text-red-600">Erro: {error}</div>)}
      {message && (<div className="text-sm text-blue-600">{message}</div>)}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => {
          const conn = integrations[p]?.connected;
          return (
            <div key={p} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium capitalize">{p.replace(/_/g, " ")}</h2>
                  <p className={conn ? "text-green-600" : "text-gray-600"}>
                    {conn ? "Conectado" : "Não conectado"}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-sm">Selecionado: <span className="font-mono">{renderSelectedId(p)}</span></div>

              <div className="mt-4 flex gap-2">
                {!conn ? (
                  <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => handleConnect(p)}>
                    Conectar via OAuth
                  </button>
                ) : (
                  <>
                    <button className="px-3 py-2 rounded bg-indigo-600 text-white" onClick={() => handleSync(p)}>
                      Sync & Auto-configure
                    </button>
                    {p === "facebook" || p === "google_analytics" || p === "tiktok" ? (
                      <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={() => sendTestEvent(p)}>
                        Send Test Event
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
