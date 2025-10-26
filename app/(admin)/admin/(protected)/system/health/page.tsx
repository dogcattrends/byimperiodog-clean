"use client";

import { useState } from "react";
import { Activity, Zap, Clock, AlertTriangle, CheckCircle, XCircle, TrendingUp } from "lucide-react";

export default function SystemHealth() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  const healthMetrics = {
    uptime: 99.97,
    responseTime: 145,
    errorRate: 0.03,
    activeUsers: 342,
  };

  const webVitals = {
    lcp: { value: 1.8, status: "good", label: "Largest Contentful Paint" },
    fid: { value: 45, status: "good", label: "First Input Delay" },
    cls: { value: 0.08, status: "good", label: "Cumulative Layout Shift" },
    ttfb: { value: 320, status: "good", label: "Time to First Byte" },
  };

  const recentErrors = [
    {
      timestamp: "2025-10-26 14:32:15",
      type: "TypeError",
      message: "Cannot read property 'map' of undefined",
      page: "/blog/post-123",
      severity: "medium",
    },
    {
      timestamp: "2025-10-26 13:15:42",
      type: "NetworkError",
      message: "Failed to fetch API data",
      page: "/admin/analytics",
      severity: "low",
    },
    {
      timestamp: "2025-10-26 11:05:30",
      type: "404",
      message: "Page not found",
      page: "/old-page",
      severity: "low",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600 bg-green-100";
      case "needs-improvement":
        return "text-yellow-600 bg-yellow-100";
      case "poor":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-700 bg-red-100";
      case "medium":
        return "text-yellow-700 bg-yellow-100";
      case "low":
        return "text-blue-700 bg-blue-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Saúde do Sistema</h1>
          <p className="mt-1 text-sm text-emerald-700">
            Monitoramento de Core Web Vitals, uptime e logs de erro
          </p>
        </div>
        <div className="flex gap-2 rounded-lg border border-emerald-200 bg-white p-1">
          {(["24h", "7d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                timeRange === range
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Uptime</p>
              <p className="mt-2 text-3xl font-bold text-green-900">{healthMetrics.uptime}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Response Time</p>
              <p className="mt-2 text-3xl font-bold text-blue-900">{healthMetrics.responseTime}ms</p>
            </div>
            <Zap className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Error Rate</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{healthMetrics.errorRate}%</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Active Users</p>
              <p className="mt-2 text-3xl font-bold text-purple-900">{healthMetrics.activeUsers}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-emerald-900">Core Web Vitals</h2>
        <p className="mt-1 text-sm text-emerald-600">Métricas de performance do usuário</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(webVitals).map(([key, vital]) => (
            <div
              key={key}
              className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                  {key.toUpperCase()}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(
                    vital.status
                  )}`}
                >
                  {vital.status === "good" ? "Bom" : vital.status}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-900">
                {vital.value}
                {key === "lcp" || key === "fid" || key === "ttfb" ? "ms" : ""}
              </p>
              <p className="mt-1 text-xs text-emerald-600">{vital.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Erros Recentes */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-emerald-900">Erros Recentes</h2>
          <button className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-50">
            Ver Todos
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {recentErrors.map((error, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4"
            >
              <XCircle className="h-5 w-5 shrink-0 text-red-500" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-emerald-900">
                    {error.type}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${getSeverityColor(
                      error.severity
                    )}`}
                  >
                    {error.severity === "high"
                      ? "Alta"
                      : error.severity === "medium"
                      ? "Média"
                      : "Baixa"}
                  </span>
                  <span className="text-xs text-emerald-600">{error.timestamp}</span>
                </div>
                <p className="text-sm text-emerald-900">{error.message}</p>
                <code className="text-xs text-emerald-600">{error.page}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
