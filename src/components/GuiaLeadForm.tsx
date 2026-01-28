"use client";
import { useState } from "react";

const STAGES = [
  "Só pesquisando",
  "Já decidi pela raça",
  "Quero comprar em breve",
  "Já estou escolhendo criador"
];

export default function GuiaLeadForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({
    nome: "",
    contato: "",
    cidade: "",
    estagio: STAGES[0],
    duvida: "",
    consent: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name, value, type } = target;
    const checked = (target as HTMLInputElement).checked;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Tracking: início do envio
    window.track?.event?.("lead_form_submitted", { ...form });
    try {
      // Enviar para Supabase ou API
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erro ao enviar. Tente novamente.");
      setSuccess(true);
      window.track?.event?.("lead_form_success", { ...form });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
      window.track?.event?.("lead_form_error", { ...form, error: err.message });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <h3 className="text-lg font-bold text-emerald-900">Guia liberado!</h3>
        <p className="mt-2 text-zinc-700">Obrigado por preencher. O download do Guia do Tutor está liberado abaixo.</p>
        {/* Aqui pode aparecer o botão/link para baixar o PDF via token */}
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-zinc-700">Nome</label>
        <input id="nome" name="nome" type="text" required className="mt-1 w-full rounded-lg border px-3 py-2" value={form.nome} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="contato" className="block text-sm font-medium text-zinc-700">E-mail ou WhatsApp</label>
        <input id="contato" name="contato" type="text" required className="mt-1 w-full rounded-lg border px-3 py-2" value={form.contato} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="cidade" className="block text-sm font-medium text-zinc-700">Cidade/UF</label>
        <input id="cidade" name="cidade" type="text" required className="mt-1 w-full rounded-lg border px-3 py-2" value={form.cidade} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="estagio" className="block text-sm font-medium text-zinc-700">Em que estágio você está?</label>
        <select id="estagio" name="estagio" className="mt-1 w-full rounded-lg border px-3 py-2" value={form.estagio} onChange={handleChange}>
          {STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="duvida" className="block text-sm font-medium text-zinc-700">Qual sua maior dúvida ou receio?</label>
        <textarea id="duvida" name="duvida" rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" value={form.duvida} onChange={handleChange} />
      </div>
      <div className="flex items-center gap-2">
        <input id="consent" name="consent" type="checkbox" checked={form.consent} onChange={handleChange} />
        <label htmlFor="consent" className="text-sm text-zinc-700">Aceito receber dicas e novidades</label>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button type="submit" disabled={loading} className="w-full rounded-full bg-emerald-600 py-3 text-white font-semibold hover:bg-emerald-700 transition">
        {loading ? "Enviando..." : "Baixar Guia do Tutor"}
      </button>
    </form>
  );
}
