/**
 * Página Admin: Configurações de Pixel e Analytics (básico)
 * Rota: /admin/settings/tracking
 */

"use client";

import { FormEvent, useState } from "react";

import { useTrackingSettings } from "@/hooks/useTrackingSettings";

export default function TrackingSettingsPage() {
  const { values, loading, saving, error, success, setValues, save } = useTrackingSettings();
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await save();
  };

  const handleTestPixel = () => {
    const pixelId = values.facebookPixelId.trim();
    if (!pixelId) {
      setTestMessage({ type: "error", text: "Configure o Facebook Pixel ID antes de testar." });
      return;
    }

    if (typeof window === "undefined") return;
    const fbq = (window as any).fbq;
    if (typeof fbq !== "function") {
      setTestMessage({ type: "error", text: "Não foi possível disparar o evento de teste." });
      return;
    }

    setTestLoading(true);
    setTestMessage({ type: "info", text: "Enviando evento de teste..." });

    try {
      fbq("track", "TestEvent", { source: "admin_test_button", test_event: true });
      setTestMessage({
        type: "success",
        text: "Evento de teste enviado. Verifique no Meta Pixel Helper / Test Events.",
      });
    } catch (err) {
      console.error("[TestPixel] erro ao disparar evento:", err);
      setTestMessage({ type: "error", text: "Não foi possível disparar o evento de teste." });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Configurações de Pixel e Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">
            Defina os IDs públicos para injetar scripts no site. Valores vazios desabilitam o tracking.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {loading ? (
            <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Carregando configurações...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-md border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-900">
              Configurações salvas com sucesso.
            </div>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Facebook Pixel ID</label>
            <input
              type="text"
              value={values.facebookPixelId}
              onChange={(e) => setValues((prev) => ({ ...prev, facebookPixelId: e.target.value }))}
              placeholder="Ex: 123456789012345"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
            />
            <p className="text-xs text-gray-500">Somente dígitos, sem espaços. Deixe vazio para desativar.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Google Analytics ID (GA4)</label>
            <input
              type="text"
              value={values.googleAnalyticsId}
              onChange={(e) => setValues((prev) => ({ ...prev, googleAnalyticsId: e.target.value }))}
              placeholder="Ex: G-ABC123DEF"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
            />
            <p className="text-xs text-gray-500">Formato básico: começa com G-. Opcional.</p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar configurações"}
            </button>
            <button
              type="button"
              onClick={handleTestPixel}
              disabled={testLoading}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {testLoading ? "Enviando evento de teste..." : "Testar Pixel"}
            </button>
          </div>

          {testMessage ? (
            <div
              className={`rounded-md px-4 py-3 text-sm ${
                testMessage.type === "success"
                  ? "border border-green-200 bg-green-50 text-green-800"
                  : testMessage.type === "info"
                  ? "border border-blue-200 bg-blue-50 text-blue-800"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {testMessage.text}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
