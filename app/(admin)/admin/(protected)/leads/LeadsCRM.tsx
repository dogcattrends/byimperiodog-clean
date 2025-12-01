"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { BadgeCheck, CheckCircle2, Filter, MessageCircle, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { computeLeadRisk } from "@/lib/leadRisk";
import type { AdminLead } from "./types";

type Insight = {
  intent?: string | null;
  urgency?: string | null;
  risk?: string | null;
  score?: number | null;
};

function normalizePhone(phone?: string | null) {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

function waLink(phone?: string | null, msg?: string) {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  const text = msg || "Oi! Vi seu interesse nos filhotes da By Império Dog e quero te ajudar a escolher o melhor Spitz.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default function LeadsCRM({ items }: { items: AdminLead[] }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [color, setColor] = useState("");
  const [status, setStatus] = useState("");
  const [order, setOrder] = useState<"recent" | "status" | "city" | "risk">("recent");
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [intelMap, setIntelMap] = useState<Record<string, Insight>>({});

  useEffect(() => {
    const saved = localStorage.getItem("admin-leads-filters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCity(parsed.city ?? "");
        setColor(parsed.color ?? "");
        setStatus(parsed.status ?? "");
        setOrder(parsed.order ?? "recent");
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("admin-leads-filters", JSON.stringify({ city, color, status, order }));
  }, [city, color, status, order]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    items.forEach((l) => {
      if (l.cidade || l.city) set.add((l.cidade || l.city) as string);
    });
    return Array.from(set).sort();
  }, [items]);

  const colors = useMemo(() => {
    const set = new Set<string>();
    items.forEach((l) => {
      if (l.cor_preferida || l.color) set.add((l.cor_preferida || l.color) as string);
    });
    return Array.from(set).sort();
  }, [items]);

  const riskMap = useMemo(() => {
    const map: Record<string, { level: "baixo" | "medio" | "alto"; score: number; reason: string; action: string }> = {};
    items.forEach((l) => {
      const intel = intelMap[l.id];
      const risk = computeLeadRisk(
        { id: l.id, status: l.status, created_at: l.created_at, cor_preferida: l.cor_preferida, color: l.color },
        { risk: intel?.risk },
      );
      map[l.id] = risk;
    });
    return map;
  }, [items, intelMap]);

  const filtered = useMemo(() => {
    const arr = items.filter((l) => {
      if (city && (l.cidade || l.city) !== city) return false;
      if (color && (l.cor_preferida || l.color) !== color) return false;
      if (status && (l.status || "novo") !== status) return false;
      return true;
    });
    return arr.sort((a, b) => {
      if (order === "status") return (a.status || "").localeCompare(b.status || "");
      if (order === "city") return (a.cidade || a.city || "").localeCompare(b.cidade || b.city || "");
      if (order === "risk") {
        const ra = riskMap[a.id]?.score ?? 0;
        const rb = riskMap[b.id]?.score ?? 0;
        return rb - ra;
      }
      return (b.created_at || "").localeCompare(a.created_at || "");
    });
  }, [items, city, color, status, order, riskMap]);

  const updateStatus = (id: string, newStatus: string) => {
    setMutatingId(id);
    startTransition(async () => {
      await fetch("/api/admin/leads/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      router.refresh();
      setMutatingId(null);
    });
  };

  const processIntel = (id: string) => {
    setMutatingId(id);
    startTransition(async () => {
      const res = await fetch("/api/admin/leads/intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id }),
      });
      const json = await res.json();
      if (json?.insight) {
        setIntelMap((prev) => ({ ...prev, [id]: json.insight as Insight }));
      }
      setMutatingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Leads</h1>
          <p className="text-sm text-[var(--text-muted)]">Mini-CRM: status, IA e ações rápidas.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Filter className="h-4 w-4" aria-hidden />
          {filtered.length} de {items.length} leads
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Select label="Status" value={status} onChange={setStatus} options={["novo", "em_contato", "fechado", "perdido"]} placeholder="Todos" />
        <Select label="Cidade" value={city} onChange={setCity} options={cities} placeholder="Todas" />
        <Select label="Cor" value={color} onChange={setColor} options={colors} placeholder="Todas" />
        <Select
          label="Ordenar"
          value={order}
          onChange={(v) => setOrder(v as any)}
          options={["recent", "status", "city", "risk"]}
          placeholder="recent"
        />
        <button
          type="button"
          onClick={() => {
            setCity("");
            setColor("");
            setStatus("");
            setOrder("recent");
          }}
          className="text-sm font-semibold text-rose-600 hover:underline"
        >
          Limpar filtros
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <table className="min-w-full divide-y divide-[var(--border)] text-sm" role="table" aria-label="Lista de leads">
          <thead className="bg-[var(--surface-2)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th scope="col" className="px-4 py-3" aria-sort={order === "recent" ? "descending" : "none"}>
                Nome
              </th>
              <th scope="col" className="px-4 py-3">WhatsApp</th>
              <th scope="col" className="px-4 py-3">Cidade/UF</th>
              <th scope="col" className="px-4 py-3">Filhote</th>
              <th scope="col" className="px-4 py-3">Cor desejada</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Risco</th>
              <th scope="col" className="px-4 py-3">IA</th>
              <th scope="col" className="px-4 py-3">Origem</th>
              <th scope="col" className="px-4 py-3">Data/Hora</th>
              <th scope="col" className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-white">
            {filtered.map((lead) => {
              const phone = lead.telefone || lead.phone || "";
              const whatsapp = waLink(phone);
              const intel = intelMap[lead.id];
              const risk = riskMap[lead.id];
              const statusTone =
                ["novo", "em_contato", "fechado", "perdido"].includes(lead.status || "novo") && lead.status
                  ? {
                      novo: "bg-slate-100 text-slate-800",
                      em_contato: "bg-amber-100 text-amber-800",
                      fechado: "bg-emerald-100 text-emerald-800",
                      perdido: "bg-rose-100 text-rose-800",
                    }[lead.status as keyof typeof lead.status]
                  : "bg-slate-100 text-slate-800";
              const riskTone =
                risk?.level === "alto"
                  ? "bg-rose-100 text-rose-800"
                  : risk?.level === "medio"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800";
              return (
                <tr key={lead.id} className="hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3 font-semibold text-[var(--text)]">
                    <a className="hover:underline" href={`/admin/leads/${lead.id}`}>
                      {lead.nome || lead.name || "Lead"}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {phone || "—"}
                    {whatsapp && (
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                        aria-label={`Abrir WhatsApp para ${lead.nome || "lead"}`}
                      >
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                        WhatsApp
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {[lead.cidade || lead.city, lead.estado || lead.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{lead.page_slug || lead.page || "—"}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{lead.cor_preferida || lead.color || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
                      {lead.status || "novo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${riskTone}`}>
                        {risk?.level ?? "—"} {risk ? `${risk.score} pts` : ""}
                      </span>
                      {risk?.level === "alto" && <span className="text-[11px] font-semibold text-rose-700">Risco alto • priorize</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {intel ? (
                      <div className="flex items-center gap-2">
                        <Badge intent={intel.intent} />
                        <span className="text-xs font-semibold text-[var(--text)]">{intel.score ?? "—"} pts</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => processIntel(lead.id)}
                        disabled={mutatingId === lead.id}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
                      >
                        {mutatingId === lead.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        )}
                        IA
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{lead.utm_source || lead.page || "—"}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {lead.created_at ? new Date(lead.created_at).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {["em_contato", "fechado"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateStatus(lead.id, st)}
                          disabled={mutatingId === lead.id}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
                        >
                          {st === "fechado" ? <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
                          {st === "fechado" ? "Fechar" : "Em contato"}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/leads/${lead.id}`)}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
                      >
                        Detalhes
                      </button>
                      {mutatingId === lead.id && <RefreshCw className="h-4 w-4 animate-spin text-[var(--text-muted)]" aria-hidden />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <label className="text-sm font-semibold text-[var(--text)]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ml-2 h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function Badge({ intent }: { intent?: string | null }) {
  const tone =
    intent === "alta"
      ? "bg-emerald-100 text-emerald-800"
      : intent === "media"
        ? "bg-amber-100 text-amber-800"
        : intent === "baixa"
          ? "bg-slate-100 text-slate-800"
          : "bg-slate-100 text-slate-800";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{intent || "—"}</span>;
}
