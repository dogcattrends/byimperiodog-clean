
import type { Database } from '../types/supabase';

import { supabaseAdmin } from "./supabaseAdmin";
type PuppyRecord = Database['public']['Tables']['puppies']['Row'];

export type PuppyRecommendation = {
 puppyIdIdeal: string | null;
 top3Matches: { id: string; name: string; score: number; reason: string }[];
 reasoningText: string;
 score: number;
 upsellOpportunity: boolean;
};

type ScoredRow = PuppyRecord & { score: number; reason: string };

function normalize(value?: string | null) {
 return (value ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
}

function parseBudget(budget?: string | null) {
 if (!budget) return null;
 const match = budget.match(/(\d{3,6})/);
 if (!match) return null;
 return Number(match[1]) * (budget.includes("mil") ? 1000 : 1);
}

function scorePuppy(p: PuppyRecord, prefs: { color?: string; sex?: string; city?: string; budget?: number | null }) {
 let score = 0;
 const reasons: string[] = [];

 if (prefs.color && normalize(p.color).includes(normalize(prefs.color))) {
 score += 30;
 reasons.push("Cor desejada");
 }
 const pupSex = typeof (p as unknown as Record<string, unknown>).sex === 'string' ? (p as unknown as Record<string, unknown>).sex as string : typeof (p as unknown as Record<string, unknown>).sexo === 'string' ? (p as unknown as Record<string, unknown>).sexo as string : null;
 const pupCity = typeof (p as unknown as Record<string, unknown>).city === 'string' ? (p as unknown as Record<string, unknown>).city as string : typeof (p as unknown as Record<string, unknown>).cidade === 'string' ? (p as unknown as Record<string, unknown>).cidade as string : null;

 if (prefs.sex && pupSex && normalize(pupSex) === normalize(prefs.sex)) {
 score += 20;
 reasons.push("Sexo desejado");
 }
 if (prefs.city && pupCity && normalize(pupCity) === normalize(prefs.city)) {
 score += 15;
 reasons.push("Cidade próxima");
 }
 if ((p.status ?? "available") === "available") {
 score += 10;
 reasons.push("Disponível");
 }
 if (prefs.budget && p.price_cents) {
 const price = p.price_cents / 100;
 const diff = Math.abs(price - prefs.budget);
 if (diff <= prefs.budget * 0.1) {
 score += 15;
 reasons.push("Preço alinhado");
 } else if (price > prefs.budget && diff <= prefs.budget * 0.2) {
 score += 5;
 reasons.push("Upsell possível");
 }
 }

 if (reasons.length === 0) reasons.push("Compatibilidade geral");
 return { score, reason: reasons.join(", ") };
}

export async function recommendPuppiesForLead(leadId: string): Promise<PuppyRecommendation> {
 const sb = supabaseAdmin();

 const [{ data: lead }, { data: insight }] = await Promise.all([
 sb
 .from("leads")
 .select("id,nome,telefone,cidade,estado,cor_preferida,sexo_preferido,mensagem")
 .eq("id", leadId)
 .maybeSingle(),
 sb.from("lead_ai_insights").select("desired_color,desired_sex,desired_city,budget_inferred,score").eq("lead_id", leadId).maybeSingle(),
 ]);

 if (!lead) {
 throw new Error("Lead não encontrado");
 }

 const prefs = {
 color: insight?.desired_color || lead.cor_preferida || undefined,
 sex: insight?.desired_sex || lead.sexo_preferido || undefined,
 city: insight?.desired_city || lead.cidade || undefined,
 budget: parseBudget(insight?.budget_inferred),
 };

 const { data: puppies } = await sb
 .from("puppies")
 .select("id,name,color,sex,price_cents,city,state,status")
 .or("status.is.null,status.eq.available")
 .limit(100);

 const scored = (puppies
 ?.map((p: unknown) => {
 const rec = p as PuppyRecord;
 const { score, reason } = scorePuppy(rec, prefs);
 return { ...rec, score, reason } as ScoredRow;
 })
 .sort((a: ScoredRow, b: ScoredRow) => b.score - a.score)
 .slice(0, 3)) as ScoredRow[] | undefined ?? [];

 const top = scored[0] as ScoredRow | undefined;

 const reasoningText = top
 ? `Recomendado "${top.name}" pela combinação de ${top.reason}.`
 : "Nenhum filhote ideal encontrado, sugira opções amplas.";

 const topPriceCents = top ? (typeof top.price_cents === 'number' ? top.price_cents as number : Number(top.price_cents ?? NaN)) : NaN;
 const upsellOpportunity = Boolean(prefs.budget && Number.isFinite(topPriceCents) && topPriceCents / 100 > (prefs.budget ?? 0) * 1.1);

 return {
 puppyIdIdeal: (top?.id as string) ?? null,
 top3Matches: scored.map((s) => ({ id: s.id as string, name: s.name as string, score: s.score, reason: s.reason })),
 reasoningText,
 score: top?.score ?? 0,
 upsellOpportunity,
 };
}
