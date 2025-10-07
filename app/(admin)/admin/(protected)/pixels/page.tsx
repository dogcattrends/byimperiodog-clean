"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, Save, Trash2 } from "lucide-react";

import { useToast } from "@/components/ui/toast";

interface PixelsState {
  gtm: string;
  ga4: string;
  fb: string;
  tiktok: string;
  googleAdsId: string;
  googleAdsLabel: string;
  pinterest: string;
  hotjar: string;
  clarity: string;
  metaVerify: string;
}

interface CustomPixelForm {
  id: string;
  label: string;
  slot: "head" | "body";
  enabled: boolean;
  code: string;
  noscript: string;
}

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `custom-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

const EMPTY_PIXEL: PixelsState = {
  gtm: "",
  ga4: "",
  fb: "",
  tiktok: "",
  googleAdsId: "",
  googleAdsLabel: "",
  pinterest: "",
  hotjar: "",
  clarity: "",
  metaVerify: "",
};

const CHAT_GPT_TEMPLATE = `// Exemplo generico (substitua pela integracao oficial do ChatGPT ou do produto que estiver usando)\nwindow.chatgptPixel = window.chatgptPixel || function(){ (window.chatgptPixel.q = window.chatgptPixel.q || []).push(arguments); };\nchatgptPixel('init', 'COLOQUE_SEU_ID_AQUI');\nchatgptPixel('track', 'PageView');`;

export default function PixelsPage() {
  const { push } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<PixelsState>(EMPTY_PIXEL);
  const [customPixels, setCustomPixels] = useState<CustomPixelForm[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const hydrateFromSettings = useCallback((settings: any) => {
    setFields({
      gtm: settings?.gtm_id ?? "",
      ga4: settings?.ga4_id ?? "",
      fb: settings?.meta_pixel_id ?? "",
      tiktok: settings?.tiktok_pixel_id ?? "",
      googleAdsId: settings?.google_ads_id ?? "",
      googleAdsLabel: settings?.google_ads_label ?? "",
      pinterest: settings?.pinterest_tag_id ?? "",
      hotjar: settings?.hotjar_id ?? "",
      clarity: settings?.clarity_id ?? "",
      metaVerify: settings?.meta_domain_verify ?? "",
    });

    const rawCustom = Array.isArray(settings?.custom_pixels) ? settings.custom_pixels : [];
    setCustomPixels(
      rawCustom.map((entry: any, index: number) => ({
        id:
          typeof entry?.id === "string" && entry.id.trim()
            ? entry.id.trim()
            : `custom-${index + 1}-${Date.now()}`,
        label: typeof entry?.label === "string" ? entry.label : "",
        slot: entry?.slot === "body" ? "body" : "head",
        enabled: entry?.enabled === false ? false : true,
        code: typeof entry?.code === "string" ? entry.code : "",
        noscript: typeof entry?.noscript === "string" ? entry.noscript : "",
      })),
    );
  }, []);

  const fetchSettings = useCallback(async () => {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) throw new Error(json?.error || "Falha ao carregar configuracoes");
    return json?.settings ?? {};
  }, []);

  const runLoad = useCallback(async () => {
    try {
      setLoading(true);
      const settings = await fetchSettings();
      hydrateFromSettings(settings);
      setMessage(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMessage(message);
      push({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [fetchSettings, hydrateFromSettings, push]);

  useEffect(() => {
    runLoad();
  }, [runLoad]);

  const readyToSave = useMemo(() => {
    if (saving || loading) return false;
    const hasCustomInvalid = customPixels.some((pixel) => pixel.enabled && (!pixel.label.trim() || !pixel.code.trim()));
    return !hasCustomInvalid;
  }, [customPixels, saving]);

  function updateField<K extends keyof PixelsState>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function updateCustomPixel(id: string, patch: Partial<CustomPixelForm>) {
    setCustomPixels((prev) => prev.map((pixel) => (pixel.id === id ? { ...pixel, ...patch } : pixel)));
  }

  function removeCustomPixel(id: string) {
    setCustomPixels((prev) => prev.filter((pixel) => pixel.id !== id));
  }

  function addCustomPixel(template: "blank" | "chatgpt" = "blank") {
    const base: CustomPixelForm = {
      id: generateId(),
      label: template === "chatgpt" ? "ChatGPT Pixel" : "",
      slot: "head",
      enabled: true,
      code: template === "chatgpt" ? CHAT_GPT_TEMPLATE : "",
      noscript: "",
    };
    setCustomPixels((prev) => [...prev, base]);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage(null);
      const payload = {
        gtm: fields.gtm.trim(),
        ga4: fields.ga4.trim(),
        meta_pixel_id: fields.fb.trim(),
        tiktok_pixel_id: fields.tiktok.trim(),
        google_ads_id: fields.googleAdsId.trim(),
        google_ads_label: fields.googleAdsLabel.trim(),
        pinterest_tag_id: fields.pinterest.trim(),
        hotjar_id: fields.hotjar.trim(),
        clarity_id: fields.clarity.trim(),
        meta_domain_verify: fields.metaVerify.trim(),
        custom_pixels: customPixels
          .map((pixel) => ({
            id: pixel.id,
            label: pixel.label.trim(),
            enabled: pixel.enabled,
            slot: pixel.slot,
            code: pixel.code.trim(),
            noscript: pixel.noscript.trim(),
          }))
          .filter((pixel) => pixel.label && pixel.code),
      };
      const response = await fetch("/api/admin/settings/pixels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.error || "Falha ao salvar configuracoes");
      push({ type: "success", message: "Pixels atualizados." });
      await runLoad();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMessage(message);
      push({ type: "error", message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 px-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold text-[var(--text)]">Pixels e Conversao</h1>
        <p className="max-w-3xl text-sm text-[var(--text-muted)]">
          Centralize todos os IDs de pixel utilizados no site. Use os campos padrao para Google, Meta, TikTok, Pinterest, Hotjar e Clarity. Para tags adicionais (como ChatGPT, scripts customizados ou integracoes beta), utilize a area de pixels personalizados.
        </p>
      </header>

      {message ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          {message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Pixels padrao</h2>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          IDs sao sincronizados com o Supabase e complementam as variaveis de ambiente. Caso um ID esteja definido via .env, ele sera exibido aqui para referencia.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Google Tag Manager"
            placeholder="GTM-XXXX"
            value={fields.gtm}
            onChange={(val) => updateField("gtm", val)}
          />
          <Field
            label="Google Analytics 4"
            placeholder="G-XXXX"
            value={fields.ga4}
            onChange={(val) => updateField("ga4", val)}
          />
          <Field
            label="Meta Pixel"
            placeholder="1234567890"
            value={fields.fb}
            onChange={(val) => updateField("fb", val)}
          />
          <Field
            label="TikTok Pixel"
            placeholder="ABCDEF123456"
            value={fields.tiktok}
            onChange={(val) => updateField("tiktok", val)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Complementos e verificacoes</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Google Ads ID"
            placeholder="AW-XXXXXX"
            value={fields.googleAdsId}
            onChange={(val) => updateField("googleAdsId", val)}
          />
          <Field
            label="Google Ads Label"
            placeholder="ABCDEF12345"
            value={fields.googleAdsLabel}
            onChange={(val) => updateField("googleAdsLabel", val)}
          />
          <Field
            label="Pinterest Tag"
            placeholder="1234567890"
            value={fields.pinterest}
            onChange={(val) => updateField("pinterest", val)}
          />
          <Field
            label="Hotjar ID"
            placeholder="123456"
            value={fields.hotjar}
            onChange={(val) => updateField("hotjar", val)}
          />
          <Field
            label="Microsoft Clarity ID"
            placeholder="abcd1234"
            value={fields.clarity}
            onChange={(val) => updateField("clarity", val)}
          />
          <Field
            label="Meta domain verification"
            placeholder="facebook-domain-verification"
            value={fields.metaVerify}
            onChange={(val) => updateField("metaVerify", val)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Pixels personalizados</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Adicione qualquer script adicional (por exemplo ChatGPT Pixel, LinkedIn Insight, scripts beta). Informe apenas o corpo do script; o sistema envolvera com a tag apropriada.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addCustomPixel("chatgpt")}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
            >
              <Plus className="h-4 w-4" aria-hidden /> ChatGPT Pixel
            </button>
            <button
              type="button"
              onClick={() => addCustomPixel("blank")}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-contrast)] shadow-sm hover:brightness-110"
            >
              <Plus className="h-4 w-4" aria-hidden /> Pixel personalizado
            </button>
          </div>
        </div>

        {customPixels.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
            Nenhum pixel personalizado adicionado.
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {customPixels.map((pixel) => (
              <li key={pixel.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Nome interno
                    </label>
                    <input
                      value={pixel.label}
                      onChange={(event) => updateCustomPixel(pixel.id, { label: event.target.value })}
                      placeholder="Ex: LinkedIn Insight"
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <input
                        type="checkbox"
                        checked={pixel.enabled}
                        onChange={(event) => updateCustomPixel(pixel.id, { enabled: event.target.checked })}
                      />
                      Ativo
                    </label>
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      Slot:
                      <select
                        value={pixel.slot}
                        onChange={(event) => updateCustomPixel(pixel.id, { slot: event.target.value as "head" | "body" })}
                        className="rounded border border-[var(--border)] bg-white px-2 py-1"
                      >
                        <option value="head">Head</option>
                        <option value="body">Body</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomPixel(pixel.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remover
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Script (sem a tag &lt;script&gt;)
                  </label>
                  <textarea
                    value={pixel.code}
                    onChange={(event) => updateCustomPixel(pixel.id, { code: event.target.value })}
                    rows={5}
                    spellCheck={false}
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Conteudo dentro de &lt;noscript&gt; (opcional)
                  </label>
                  <textarea
                    value={pixel.noscript}
                    onChange={(event) => updateCustomPixel(pixel.id, { noscript: event.target.value })}
                    rows={3}
                    spellCheck={false}
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-mono"
                  />
                </div>

                {pixel.enabled && (!pixel.label.trim() || !pixel.code.trim()) ? (
                  <p className="text-xs font-semibold text-[var(--error)]">
                    Preencha nome e script para ativar este pixel.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={runLoad}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
          disabled={loading || saving}
        >
          <RefreshCcw className="h-4 w-4" aria-hidden /> Recarregar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-sm transition hover:brightness-110 disabled:opacity-60"
          disabled={!readyToSave}
        >
          <Save className="h-4 w-4" aria-hidden /> {saving ? "Salvando..." : "Salvar configuracoes"}
        </button>
      </footer>
    </div>
  );
}

interface FieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

function Field({ label, placeholder, value, onChange }: FieldProps) {
  return (
    <label className="space-y-1 text-sm">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
      />
    </label>
  );
}

