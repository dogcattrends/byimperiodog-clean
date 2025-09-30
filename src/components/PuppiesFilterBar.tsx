"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

type Props = {
  q: string;
  setQ: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  showing: number;
  total: number;
  availableColors?: string[];
  onReset?: () => void;
};

export default function PuppiesFilterBar({ q, setQ, gender, setGender, status, setStatus, color, setColor, showing, total, availableColors, onReset, }: Props) {
  const [qLocal, setQLocal] = useState(q);
  useEffect(() => setQLocal(q), [q]);
  useEffect(() => { const t = setTimeout(() => setQ(qLocal.trimStart()), 250); return () => clearTimeout(t); }, [qLocal, setQ]);
  useEffect(() => { const onKey = (e: KeyboardEvent) => e.key === "Escape" && setQLocal(""); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);

  const colors = useMemo(() => (availableColors && availableColors.length ? availableColors : ["preto", "branco", "laranja", "chocolate"]).sort((a, b) => a.localeCompare(b, "pt-BR")), [availableColors]);

  const chips = useMemo(() => {
    const arr: { label: string; emoji?: string; onClear: () => void }[] = [];
    if (q) arr.push({ label: `“${q}”`, emoji: "🔎", onClear: () => setQ("") });
    if (gender) arr.push({ label: gender === "male" ? "Macho" : "Fêmea", emoji: gender === "male" ? "♂️" : "♀️", onClear: () => setGender("") });
    if (status)
      arr.push({ label: status === "disponivel" ? "Disponível" : status === "reservado" ? "Reservado" : "Vendido", emoji: status === "disponivel" ? "🟢" : status === "reservado" ? "🟡" : "🔴", onClear: () => setStatus("") });
    if (color) arr.push({ label: titleCase(color), emoji: "🎨", onClear: () => setColor("") });
    return arr;
  }, [q, gender, status, color, setQ, setGender, setStatus, setColor]);

  const resetAll = () => { setQ(""); setQLocal(""); setGender(""); setStatus(""); setColor(""); onReset?.(); };

  return (
    <section className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-all duration-200" aria-label="Filtros de filhotes" role="region">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-xs text-zinc-600 sm:px-6 lg:px-8">
        <span>
          Mostrando <b className="text-zinc-900">{showing}</b> de <b className="text-zinc-900">{total}</b> filhote(s)
        </span>
        {chips.length > 0 && (
          <button onClick={resetAll} className="rounded-full px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50">Limpar tudo ({chips.length})</button>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <label className="relative col-span-1 md:col-span-2">
            <span className="sr-only">Buscar por nome ou cor</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input value={qLocal} onChange={(e) => setQLocal(e.target.value)} placeholder="Buscar por nome/cor" className="w-full rounded-2xl border px-9 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500" aria-label="Buscar por nome ou cor" inputMode="search" autoComplete="off" />
            {qLocal && (
              <button type="button" onClick={() => setQLocal("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition hover:bg-zinc-100" aria-label="Limpar busca">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>

          <label>
            <span className="sr-only">Filtrar por sexo</span>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full appearance-none rounded-2xl border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500" aria-label="Filtrar por sexo">
              <option value="">Sexo: todos</option>
              <option value="male">Macho</option>
              <option value="female">Fêmea</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Filtrar por status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full appearance-none rounded-2xl border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500" aria-label="Filtrar por status">
              <option value="">Status: todos</option>
              <option value="disponivel">Disponível</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Filtrar por cor</span>
            <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full appearance-none rounded-2xl border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500" aria-label="Filtrar por cor">
              <option value="">Cor: todas</option>
              {colors.map((c) => (
                <option key={c} value={c}>{titleCase(c)}</option>
              ))}
            </select>
          </label>

          <div aria-hidden className="hidden md:block" />
        </div>

        {chips.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <li key={i}>
                <button onClick={c.onClear} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-200">
                  {c.emoji} {c.label}
                  <X className="ml-1 h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function titleCase(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

