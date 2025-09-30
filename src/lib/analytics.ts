// Client-side analytics: Web Vitals (LCP, INP, CLS) + custom events
// Hardened contra falhas de rede / dev ruidoso / offline.

export type AnalyticsEvent = {
  name: string;
  value?: number;
  id?: string;
  label?: string;
  meta?: Record<string, any>;
};

const endpoint = '/api/analytics';
const IS_PROD = process.env.NODE_ENV === 'production';
const DISABLED = process.env.NEXT_PUBLIC_DISABLE_ANALYTICS === '1' || process.env.DISABLE_ANALYTICS === '1';
const FORCE = process.env.NEXT_PUBLIC_FORCE_ANALYTICS === '1';

// Dedupe simples: evita spam de mesmo (name+id+path) em curta janela.
const recent = new Set<string>();
let recentTimer: any = null;
function markRecent(key: string) {
  recent.add(key);
  if (!recentTimer) {
    recentTimer = setTimeout(()=> {
      recent.clear();
      recentTimer = null;
    }, 15_000); // janela de 15s suficiente para evitar duplicações iniciais
  }
}

function shouldSkip(evt: AnalyticsEvent): boolean {
  if (DISABLED) return true; // desligado explicitamente
  if (!IS_PROD && !FORCE) return true; // só coleta em produção (ou se forçado)
  if (typeof window === 'undefined') return true; // SSR
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true; // offline
  if (!evt?.name) return true;
  const path = typeof location !== 'undefined' ? location.pathname : '';
  const key = `${evt.name}|${evt.id||''}|${path}`;
  if (recent.has(key)) return true;
  markRecent(key);
  return false;
}

async function post(evt: AnalyticsEvent) {
  if (shouldSkip(evt)) return;
  const body = {
    name: evt.name,
    value: typeof evt.value === 'number' ? evt.value : null,
    id: evt.id ?? null,
    label: evt.label ?? null,
    meta: evt.meta ?? null,
    path: typeof location !== 'undefined' ? location.pathname : null,
    ts: Date.now(),
  };
  const json = JSON.stringify(body);

  try {
    // Preferir sendBeacon se disponível (menor chance de abort no unload)
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([json], { type: 'application/json' });
      const ok = (navigator as any).sendBeacon(endpoint, blob);
      if (!ok) {
        // Fallback para fetch (mantém keepalive)
        await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json, keepalive: true });
      }
    } else {
      await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json, keepalive: true });
    }
  } catch (err:any) {
    // Silencioso em produção; em dev mostrar debug leve (não stack completa)
    if (!IS_PROD && !DISABLED) {
      // eslint-disable-next-line no-console
      console.debug('[analytics.skip]', evt.name, err?.message);
    }
  }
}

export async function initWebVitals() {
  if (DISABLED || (!IS_PROD && !FORCE)) return; // não inicializa listeners desnecessários
  if (typeof window === 'undefined') return;
  try {
    const webVitals = await import('web-vitals');
    webVitals.onLCP((m)=> post({ name:'web_vitals_lcp', value:m.value, id:m.id, label:m.name }));
    webVitals.onINP((m)=> post({ name:'web_vitals_inp', value:m.value, id:m.id, label:m.name }));
    webVitals.onCLS((m)=> post({ name:'web_vitals_cls', value:m.value, id:m.id, label:m.name }));
  } catch {
    if (!IS_PROD) {
      // eslint-disable-next-line no-console
      console.debug('[analytics] web-vitals não instalado (ok)');
    }
  }
}

export function logEvent(name: string, meta?: Record<string, any>) {
  post({ name, meta });
}

