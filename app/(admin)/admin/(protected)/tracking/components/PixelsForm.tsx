"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";

import { useToast } from "@/components/ui/toast";

import { pixelsFormSchema, type PixelsFormValues } from "./schema";
import { savePixelsSettings } from "./actions";

type PixelsFormProps = {
  initialValues: PixelsFormValues;
  updatedAt: string | null;
};

const ENVIRONMENT_LABEL: Record<keyof PixelsFormValues, string> = {
  production: "Producao",
  staging: "Staging",
};

// Mensagens de ajuda para cada campo de identificador de pixel/tag.
const HELP_TEXT: Record<string, string> = {
  gtmId: "Exemplo: GTM-ABC1234 (4-12 chars).",
  ga4Id: "Exemplo: G-ABCDEF1234 (8-12 chars).",
  metaPixelId: "Somente digitos (8-20). Use o ID do Gerenciador de Eventos.",
  tiktokPixelId: "Alfanumerico (5-32). Sem espacos.",
  googleAdsId: "Exemplo: AW-123456789 (8-12 digitos).",
  googleAdsConversionLabel: "Label de conversao (ate 160 chars).",
  pinterestId: "Somente digitos (5-25).",
  hotjarId: "Somente digitos (5-10).",
  clarityId: "Alfanumerico + - _ (6-20).",
  metaDomainVerification: "Token alfanumerico da Meta (10-120)."
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatLabel(label: string) {
  return label.replace(/Id\b/i, "ID");
}

function toReadableDate(value: string | null) {
  if (!value) return null;
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return null;
  }
}

export function PixelsForm({ initialValues, updatedAt }: PixelsFormProps) {
  const { push } = useToast();
  const [activeEnvironment, setActiveEnvironment] = useState<keyof PixelsFormValues>("production");
  const [isSaving, startSaving] = useTransition();
  const [testStatus, setTestStatus] = useState<{
    pixel: string;
    id: string;
    type: "pending" | "success" | "error" | null;
    message: string | null;
  }>({ pixel: "", id: "", type: null, message: null });
  const [lastConfirmedPixel, setLastConfirmedPixel] = useState<string | null>(null);
  const testTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<PixelsFormValues>({
    resolver: zodResolver(pixelsFormSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  const status = useMemo(() => form.formState, [form.formState]);
  const readableUpdatedAt = useMemo(() => toReadableDate(updatedAt), [updatedAt]);

  const onSubmit = form.handleSubmit((values) => {
    startSaving(async () => {
      try {
        await savePixelsSettings(values);
        push({ type: "success", message: "Configuracoes atualizadas com sucesso." });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Nao foi possivel salvar as configuracoes.";
        push({ type: "error", message });
      }
    });
  });

  const env = form.watch(activeEnvironment);
  const setValue = form.setValue;

  // Ouve retorno do teste vindo da aba pÃºblica via postMessage
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (typeof window === "undefined") return;
      if (event.origin !== window.location.origin) return;
      const data = event.data as { source?: string; ok?: boolean; pixel?: string };
      if (data?.source !== "pixel_test") return;
      if (testTimeout.current) {
        clearTimeout(testTimeout.current);
        testTimeout.current = null;
      }
      setTestStatus({
        pixel: data.pixel ?? "",
        id: "",
        type: data.ok ? "success" : "error",
        message: data.ok
          ? "Pixel testado com sucesso."
          : "Falha ao testar o pixel. Verifique o helper/DebugView.",
      });
      if (data.ok) {
        push({
          type: "success",
          message: `Pixel ${data.pixel ?? ""} testado com sucesso.`,
        });
      } else {
        push({
          type: "error",
          message: `Falha ao testar o pixel ${data.pixel ?? ""}.`,
        });
      }
    };
    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
      if (testTimeout.current) { clearTimeout(testTimeout.current); }
    };
  }, [push]);

  const openPublicTest = (pixel: "meta" | "ga4" | "gtm" | "tiktok", id: string) => {
    if (typeof window === "undefined") return false;
    const trimmed = (id || "").trim();
    if (!trimmed) {
      push({ type: "error", message: "Configure o ID antes de testar." });
      return false;
    }
    const url = new URL(window.location.origin);
    url.searchParams.set("pixel_test", pixel);
    url.searchParams.set("pixel_id", trimmed);
    // manter opener para receber postMessage de volta
    const newTab = window.open(url.toString(), "_blank");
    if (!newTab) {
      push({ type: "error", message: "Pop-up bloqueado. Permita abrir nova aba para testar." });
      return false;
    }
    if (testTimeout.current) { clearTimeout(testTimeout.current); }
    setTestStatus({ pixel, id: trimmed, type: "pending", message: "Aguardando confirmacao do teste..." });
    testTimeout.current = setTimeout(() => {
      setTestStatus({ pixel, id: trimmed, type: "error", message: "Nao recebemos confirmacao do teste. Verifique o helper/DebugView." });
      push({ type: "error", message: "Nao recebemos confirmacao do teste. Verifique o helper/DebugView." });
    }, 8000);
    push({
      type: "success",
      message: "Evento de teste disparado em nova aba. Verifique no helper/DebugView.",
    });
    return true;
  };

  const renderTestButton = (label: string, pixel: "meta" | "ga4" | "gtm" | "tiktok", id: string | null | undefined) => {
    const value = (id ?? "").trim();
    const disabled = !value;
    return (
      <button
        type="button"
        onClick={() => openPublicTest(pixel, value)}
        disabled={disabled}
        className="w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        title={disabled ? "Configure o ID antes de testar" : undefined}
      >
        {label}
      </button>
    );
  };

  const renderTestStatus = () => {
    if (!testStatus.message || !testStatus.type) return null;
    const color =
      testStatus.type === "success"
        ? "text-green-700 border-green-200 bg-green-50"
        : testStatus.type === "pending"
        ? "text-blue-700 border-blue-200 bg-blue-50"
        : "text-red-700 border-red-200 bg-red-50";
    return (
      <div className={`rounded-md border px-3 py-2 text-xs ${color}`}>
        {testStatus.message}
      </div>
    );
  };

  const renderTextInput = (
    field: keyof PixelsFormValues["production"],
    label: string,
    placeholder?: string
  ) => {
    const name = `${activeEnvironment}.${field}` as const;
    const error = form.formState.errors?.[activeEnvironment]?.[field];
    return (
      <label className="space-y-1 text-sm">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {formatLabel(label)}
        </span>
        <input
          {...form.register(name)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
        />
        {error ? (
          <span className="block text-[11px] font-medium text-red-600">
            {error.message as string}
          </span>
        ) : (
          <span className="block text-[11px] text-[var(--text-muted)]">
            {HELP_TEXT[field as string] || ""}
          </span>
        )}
      </label>
    );
  };

  const renderConsentToggle = (
    field: "analyticsConsent" | "marketingConsent",
    label: string,
    description: string
  ) => {
    const name = `${activeEnvironment}.${field}` as const;
    const checked = env?.[field];
    return (
      <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => setValue(name, event.target.checked, { shouldDirty: true })}
          className="mt-1 h-4 w-4"
        />
        <span>
          <span className="block font-semibold text-[var(--text)]">{label}</span>
          <span className="block text-[var(--text-muted)]">{description}</span>
        </span>
      </label>
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Pixels e Consentimento</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Configure os identificadores de rastreamento para Producao e Staging. IDs invalidos sao
          automaticamente ignorados na camada publica.
        </p>
        {readableUpdatedAt ? (
          <p className="text-xs text-[var(--text-muted)]">
            Ultima atualizacao salva em {readableUpdatedAt}.
          </p>
        ) : null}
      </header>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 pb-4">
          {(Object.keys(ENVIRONMENT_LABEL) as Array<keyof PixelsFormValues>).map((envKey) => (
            <button
              key={envKey}
              type="button"
              onClick={() => setActiveEnvironment(envKey)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeEnvironment === envKey
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow"
                  : "border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {ENVIRONMENT_LABEL[envKey]}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              {renderTextInput("gtmId", "Google Tag Manager ID", "GTM-XXXXXXX")}
              {renderTestButton("Testar GTM", "gtm", env?.gtmId)}
            </div>

            <div className="space-y-3">
              {renderTextInput("ga4Id", "Google Analytics 4 ID", "G-XXXXXXXXX")}
              {renderTestButton("Testar Google Analytics", "ga4", env?.ga4Id)}
            </div>

            <div className="space-y-3">
              {renderTextInput("metaPixelId", "Meta Pixel ID", "1234567890")}
              {renderTestButton("Testar Facebook Pixel", "meta", env?.metaPixelId)}
            </div>

            <div className="space-y-3">
              {renderTextInput("tiktokPixelId", "TikTok Pixel ID", "ABCDEF123456789")}
              {renderTestButton("Testar TikTok Pixel", "tiktok", env?.tiktokPixelId)}
            </div>

            {renderTextInput("googleAdsId", "Google Ads ID", "AW-XXXXXXXXX")}
            {renderTextInput("googleAdsConversionLabel", "Google Ads Conversion Label")}
            {renderTextInput("pinterestId", "Pinterest Tag ID")}
            {renderTextInput("hotjarId", "Hotjar ID")}
            {renderTextInput("clarityId", "Microsoft Clarity ID")}
            {renderTextInput("metaDomainVerification", "Meta Domain Verification")}
          </div>
          {renderTestStatus()}
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {renderConsentToggle(
            "analyticsConsent",
            "Requer consentimento para analytics",
            "Quando desmarcado, GA4 e outros pixels analiticos carregam imediatamente."
          )}
          {renderConsentToggle(
            "marketingConsent",
            "Requer consentimento para marketing",
            "Controla pixels de remarketing como Meta, TikTok e Google Ads."
          )}
          {form.formState.errors?.[activeEnvironment]?.analyticsConsent ? (
            <p className="col-span-2 text-[11px] font-medium text-red-600">
              {form.formState.errors?.[activeEnvironment]?.analyticsConsent?.message as string}
            </p>
          ) : null}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isSaving || !status.isDirty}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden />
          {isSaving ? "Salvando..." : "Salvar configuracoes"}
        </button>
      </footer>
    </form>
  );
}










