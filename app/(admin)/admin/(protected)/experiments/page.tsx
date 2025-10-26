"use client";

import { useState } from "react";
import { Beaker, Play, Pause, TrendingUp, Users, Target, CheckCircle, XCircle } from "lucide-react";

interface Experiment {
  id: string;
  name: string;
  status: "running" | "paused" | "completed";
  variantA: { name: string; conversions: number; visitors: number };
  variantB: { name: string; conversions: number; visitors: number };
  startDate: string;
  winner?: "A" | "B";
}

export default function Experiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([
    {
      id: "1",
      name: "CTA Button Color - Homepage",
      status: "running",
      variantA: { name: "Green Button", conversions: 145, visitors: 1200 },
      variantB: { name: "Blue Button", conversions: 178, visitors: 1210 },
      startDate: "2025-10-20",
    },
    {
      id: "2",
      name: "Hero Headline Test",
      status: "completed",
      variantA: { name: "Original", conversions: 89, visitors: 890 },
      variantB: { name: "New Copy", conversions: 112, visitors: 900 },
      startDate: "2025-10-10",
      winner: "B",
    },
    {
      id: "3",
      name: "Pricing Page Layout",
      status: "paused",
      variantA: { name: "Layout A", conversions: 45, visitors: 450 },
      variantB: { name: "Layout B", conversions: 52, visitors: 460 },
      startDate: "2025-10-15",
    },
  ]);

  const calculateConversionRate = (conversions: number, visitors: number) => {
     if (visitors === 0) return "0";
    return ((conversions / visitors) * 100).toFixed(2);
  };

  const toggleStatus = (id: string) => {
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              status: exp.status === "running" ? "paused" : "running",
            }
          : exp
      )
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Experimentos A/B</h1>
          <p className="mt-1 text-sm text-emerald-700">
            Crie testes, monitore resultados e otimize conversões
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
          <Beaker className="h-4 w-4" />
          Novo Experimento
        </button>
      </header>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Ativos</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">
                {experiments.filter((e) => e.status === "running").length}
              </p>
            </div>
            <Play className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Completos</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">
                {experiments.filter((e) => e.status === "completed").length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Taxa Média</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">12.4%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Lista de Experimentos */}
      <div className="space-y-4">
        {experiments.map((exp) => {
          const rateA = calculateConversionRate(exp.variantA.conversions, exp.variantA.visitors);
          const rateB = calculateConversionRate(exp.variantB.conversions, exp.variantB.visitors);
          const winnerRate = parseFloat(rateA) > parseFloat(rateB) ? "A" : "B";

          return (
            <div
              key={exp.id}
              className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-emerald-900">{exp.name}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        exp.status === "running"
                          ? "bg-green-100 text-green-700"
                          : exp.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {exp.status === "running"
                        ? "Ativo"
                        : exp.status === "completed"
                        ? "Completo"
                        : "Pausado"}
                    </span>
                    {exp.winner && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                        Vencedor: Variante {exp.winner}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-emerald-600">
                    Iniciado em {new Date(exp.startDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {exp.status !== "completed" && (
                  <button
                    onClick={() => toggleStatus(exp.id)}
                    className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-50"
                  >
                    {exp.status === "running" ? (
                      <>
                        <Pause className="inline h-4 w-4" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="inline h-4 w-4" /> Retomar
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Variante A */}
                <div
                  className={`rounded-xl border p-4 ${
                    winnerRate === "A" && exp.status === "running"
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-emerald-100 bg-emerald-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-emerald-900">
                      Variante A: {exp.variantA.name}
                    </h4>
                    {winnerRate === "A" && exp.status === "running" && (
                      <Target className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-600">Conversões</span>
                      <span className="font-semibold text-emerald-900">
                        {exp.variantA.conversions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-600">Visitantes</span>
                      <span className="font-semibold text-emerald-900">
                        {exp.variantA.visitors}
                      </span>
                    </div>
                    <div className="mt-3 rounded-lg bg-white p-2 text-center">
                      <span className="text-2xl font-bold text-emerald-900">{rateA}%</span>
                      <p className="text-xs text-emerald-600">Taxa de Conversão</p>
                    </div>
                  </div>
                </div>

                {/* Variante B */}
                <div
                  className={`rounded-xl border p-4 ${
                    winnerRate === "B" && exp.status === "running"
                      ? "border-blue-400 bg-blue-50"
                      : "border-blue-100 bg-blue-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-blue-900">
                      Variante B: {exp.variantB.name}
                    </h4>
                    {winnerRate === "B" && exp.status === "running" && (
                      <Target className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600">Conversões</span>
                      <span className="font-semibold text-blue-900">
                        {exp.variantB.conversions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600">Visitantes</span>
                      <span className="font-semibold text-blue-900">
                        {exp.variantB.visitors}
                      </span>
                    </div>
                    <div className="mt-3 rounded-lg bg-white p-2 text-center">
                      <span className="text-2xl font-bold text-blue-900">{rateB}%</span>
                      <p className="text-xs text-blue-600">Taxa de Conversão</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
