import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LeadIntelCard } from "../ui/LeadIntelCard";
import { LeadPuppyRecommenderCard } from "../ui/LeadPuppyRecommenderCard";
import { LeadCrossMatchCard } from "../ui/LeadCrossMatchCard";
import { LeadFraudBadge } from "../ui/LeadFraudBadge";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { computeLeadRisk } from "@/lib/leadRisk";

export const metadata: Metadata = {
  title: "Lead | Admin",
  robots: { index: false, follow: false },
};

function normalizePhone(phone?: string | null) {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

function waLink(phone?: string | null, name?: string | null) {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  const msg = `Olá ${name || ""}! Vi seu interesse nos filhotes da By Império Dog e quero te ajudar a escolher o melhor Spitz.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("leads")
    .select(
      "id,nome,telefone,cidade,estado,cor_preferida,sexo_preferido,status,created_at,page,page_slug,utm_source,utm_medium,utm_campaign,utm_content,mensagem"
    )
    .eq("id", params.id)
    .limit(1)
    .single();

  if (!data) notFound();

  const { data: intel } = await sb.from("lead_ai_insights").select("*").eq("lead_id", params.id).maybeSingle();
  const risk = computeLeadRisk(
    { id: data.id, status: data.status, created_at: data.created_at, cor_preferida: data.cor_preferida },
    { risk: (intel as any)?.risk },
  );

  const statusOptions = [
    { value: "novo", label: "Novo" },
    { value: "em_contato", label: "Em contato" },
    { value: "fechado", label: "Fechado" },
    { value: "perdido", label: "Perdido" },
  ];

  const whatsapp = waLink(data.telefone, data.nome);

  return (
    <div className="max-w-5xl space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{data.nome || "Lead"}</h1>
          <p className="text-sm text-[var(--text-muted)]">Lead #{data.id}</p>
        </div>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            WhatsApp
          </a>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div className="text-sm text-[var(--text-muted)]">
            <p>{data.telefone || "Telefone não informado"}</p>
            <p>{[data.cidade, data.estado].filter(Boolean).join(", ") || "Local não informado"}</p>
            <p className="text-xs">Criado em {data.created_at ? new Date(data.created_at).toLocaleString("pt-BR") : "—"}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm text-[var(--text-muted)]">
            <div>
              <dt className="font-semibold text-[var(--text)]">Cor desejada</dt>
              <dd>{data.cor_preferida || "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text)]">Sexo desejado</dt>
              <dd>{data.sexo_preferido || "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text)]">Página</dt>
              <dd>{data.page_slug || data.page || "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text)]">Origem</dt>
              <dd>{data.utm_campaign || data.utm_source || data.utm_medium || "—"}</dd>
            </div>
          </dl>

          {data.mensagem && (
            <div className="rounded-lg bg-[var(--surface-2)] p-3 text-sm text-[var(--text)]">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">Mensagem</p>
              <p className="mt-1 whitespace-pre-line">{data.mensagem}</p>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Risco</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {risk.level.toUpperCase()} • {risk.score} pts
            </p>
            <p className="text-xs text-[var(--text-muted)]">{risk.reason}</p>
            <p className="text-xs font-semibold text-rose-700">{risk.action}</p>
          </div>
          <div className="h-px w-full bg-[var(--border)]" aria-hidden />
          <p className="text-sm font-semibold text-[var(--text)]">Status</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((st) => (
              <form
                key={st.value}
                action="/api/admin/leads/status"
                method="post"
                className="inline"
                aria-label={`Marcar como ${st.label}`}
              >
                <input type="hidden" name="id" value={data.id} />
                <input type="hidden" name="status" value={st.value} />
                <button
                  type="submit"
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-[var(--border)] transition ${
                    data.status === st.value ? "bg-emerald-100 text-emerald-800" : "bg-white text-[var(--text-muted)]"
                  }`}
                >
                  {st.label}
                </button>
              </form>
            ))}
          </div>

          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
            >
              Abrir WhatsApp com mensagem
            </a>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LeadIntelCard leadId={data.id} initial={intel as any} />
        <LeadPuppyRecommenderCard leadId={data.id} />
        <LeadCrossMatchCard leadId={data.id} />
      </div>
      <LeadFraudBadge leadId={data.id} />
    </div>
  );
}
