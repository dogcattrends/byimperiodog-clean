"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";

import { useToast } from "@/components/ui/toast";

import {
  pixelsFormSchema,
  type PixelsFormValues,
  savePixelsSettings,
} from "./actions";

type PixelsFormProps = {
  initialValues: PixelsFormValues;
  updatedAt: string | null;
};

const ENVIRONMENT_LABEL: Record<keyof PixelsFormValues, string> = {
  production: "Produção",
  staging: "Staging",
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
        push({ type: "success", message: "Configurações atualizadas com sucesso." });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Não foi possível salvar as configurações.";
        push({ type: "error", message });
      }
    });
  });

  const env = form.watch(activeEnvironment);

  const setValue = form.setValue;

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
        ) : null}
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
          Configure os identificadores de rastreamento para Produção e Staging. IDs inválidos são
          automaticamente ignorados na camada pública.
        </p>
        {readableUpdatedAt ? (
          <p className="text-xs text-[var(--text-muted)]">
            Última atualização salva em {readableUpdatedAt}.
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

        <div className="grid gap-4 lg:grid-cols-2">
          {renderTextInput("gtmId", "Google Tag Manager ID", "GTM-XXXXXXX")}
          {renderTextInput("ga4Id", "Google Analytics 4 ID", "G-XXXXXXXXX")}
          {renderTextInput("metaPixelId", "Meta Pixel ID", "1234567890")}
          {renderTextInput("tiktokPixelId", "TikTok Pixel ID", "ABCDEF123456789")}
          {renderTextInput("googleAdsId", "Google Ads ID", "AW-XXXXXXXXX")}
          {renderTextInput("googleAdsConversionLabel", "Google Ads Conversion Label")}
          {renderTextInput("pinterestId", "Pinterest Tag ID")}
          {renderTextInput("hotjarId", "Hotjar ID")}
          {renderTextInput("clarityId", "Microsoft Clarity ID")}
          {renderTextInput("metaDomainVerification", "Meta Domain Verification")}
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {renderConsentToggle(
            "analyticsConsent",
            "Requer consentimento para analytics",
            "Quando desmarcado, GA4 e outros pixels analíticos carregam imediatamente."
          )}
          {renderConsentToggle(
            "marketingConsent",
            "Requer consentimento para marketing",
            "Controla pixels de remarketing como Meta, TikTok e Google Ads."
          )}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isSaving || !status.isDirty}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden />
          {isSaving ? "Salvando..." : "Salvar configurações"}
        </button>
      </footer>
    </form>
  );
}
