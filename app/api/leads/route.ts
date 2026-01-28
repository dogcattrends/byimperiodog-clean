import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createLeadDownloadToken } from "@/lib/leadDownloadTokens";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Schema de validação server-side alinhado com o funil de leads (contato + contexto + LGPD)
const leadSchema = z.object({
 nome: z.string().trim().min(2),
 telefone: z
 .string()
 .transform((value) => {
 const digits = value.replace(/\D+/g, "");
 // Aceita número em E.164 (55 + DDD + número) e normaliza para DDD+número.
 if (digits.startsWith("55") && digits.length >= 12) return digits.slice(2);
 return digits;
 })
 .refine((value) => /^\d{10,11}$/.test(value), "Telefone inválido"),
 cidade: z.string().trim().min(2),
 estado: z.string().trim().length(2).toUpperCase(),
 sexo_preferido: z.enum(["macho", "femea", "tanto_faz"]).optional(),
 cor_preferida: z.string().optional(),
 prazo_aquisicao: z.enum(["imediato", "1_mes", "2_3_meses", "3_mais"]).optional(),
 mensagem: z.string().optional(),
 email: z.string().trim().email().nullable().optional(),
 consent_lgpd: z.literal(true),
 consent_version: z.string().default("1.0"),
 consent_timestamp: z.string().optional(),
 // Tracking opcional (body)
 utm_source: z.string().nullable().optional(),
 utm_medium: z.string().nullable().optional(),
 utm_campaign: z.string().nullable().optional(),
 utm_content: z.string().nullable().optional(),
 utm_term: z.string().nullable().optional(),
 gclid: z.string().nullable().optional(),
 fbclid: z.string().nullable().optional(),
 // Página de origem (client)
 page: z.string().nullable().optional(),
 page_url: z.string().nullable().optional(),
 // Contexto opcional de página
 page_type: z.string().optional(),
 page_slug: z.string().optional(),
 page_color: z.string().optional(),
 page_city: z.string().optional(),
 page_intent: z.string().optional(),
});

function splitName(fullName: string): { first: string | null; last: string | null } {
 const cleaned = fullName.trim().replace(/\s+/g, " ");
 if (!cleaned) return { first: null, last: null };
 const parts = cleaned.split(" ");
 const first = parts[0] ?? null;
 const last = parts.length > 1 ? parts.slice(1).join(" ") : null;
 return { first, last };
}

function safePathFromReferer(referer: string | null): string | null {
 if (!referer) return null;
 try {
 const u = new URL(referer);
 return u.pathname;
 } catch {
 return null;
 }
}

function buildPreferencia(data: {
 sexo_preferido?: string;
 cor_preferida?: string;
 prazo_aquisicao?: string;
}): string | null {
 const parts: string[] = [];
 if (data.sexo_preferido) parts.push(`sexo:${data.sexo_preferido}`);
 if (data.cor_preferida) parts.push(`cor:${data.cor_preferida}`);
 if (data.prazo_aquisicao) parts.push(`prazo:${data.prazo_aquisicao}`);
 return parts.length ? parts.join(" | ") : null;
}

// Rate limiting simples (memória)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 60 segundos
const MAX_REQUESTS = 3;

function checkRateLimit(ip: string): boolean {
 const now = Date.now();
 const timestamps = rateLimitMap.get(ip) || [];
 const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
 if (recent.length >= MAX_REQUESTS) return false;
 recent.push(now);
 rateLimitMap.set(ip, recent);
 if (Math.random() < 0.01) {
 for (const [key, value] of rateLimitMap.entries()) {
 const valid = value.filter((t) => now - t < RATE_LIMIT_WINDOW);
 if (valid.length === 0) rateLimitMap.delete(key);
 else rateLimitMap.set(key, valid);
 }
 }
 return true;
}

function extractMissingColumn(message: string): string | null {
 const schemaCacheMatch = message.match(/Could not find the '([^']+)' column of 'leads' in the schema cache/i);
 if (schemaCacheMatch?.[1]) return schemaCacheMatch[1];

 const relationMatch = message.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+of\s+relation\s+"?leads"?\s+does not exist/i);
 if (relationMatch?.[1]) return relationMatch[1];

 return null;
}

async function insertLeadResilient(payload: Record<string, unknown>) {
 const sb = supabaseAdmin();
 const current = { ...payload } as Record<string, unknown>;
 let lastError: unknown = null;

 for (let attempt = 0; attempt < 10; attempt += 1) {
 const res = await sb.from("leads").insert(current).select("id").maybeSingle();
 if (!res.error) return res;

 lastError = res.error;
 const missing = extractMissingColumn(res.error.message);
 if (!missing || !(missing in current)) {
 return res;
 }
 delete current[missing];
 }

 return { data: null, error: lastError as { message?: string } };
}

export async function POST(req: NextRequest) {
 const logger = createLogger("api:leads");
 try {
 const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
 if (!checkRateLimit(ip)) {
 return NextResponse.json({ error: "Muitas requisições. Aguarde 1 minuto e tente novamente." }, { status: 429 });
 }

 const body = await req.json();
 const validation = leadSchema.safeParse(body);
 if (!validation.success) {
 return NextResponse.json({ error: "Dados inválidos", details: validation.error.errors }, { status: 400 });
 }

 const data = validation.data;
 const url = new URL(req.url);

 const referer = req.headers.get("referer");

 // UTM params (query tem precedência, fallback no body)
 const utm_source = url.searchParams.get("utm_source") ?? data.utm_source ?? (body.utm_source ?? null);
 const utm_medium = url.searchParams.get("utm_medium") ?? data.utm_medium ?? (body.utm_medium ?? null);
 const utm_campaign = url.searchParams.get("utm_campaign") ?? data.utm_campaign ?? (body.utm_campaign ?? null);
 const utm_content = url.searchParams.get("utm_content") ?? data.utm_content ?? (body.utm_content ?? null);
 const utm_term = url.searchParams.get("utm_term") ?? data.utm_term ?? (body.utm_term ?? null);

 const gclid = url.searchParams.get("gclid") ?? data.gclid ?? (body.gclid ?? null);
 const fbclid = url.searchParams.get("fbclid") ?? data.fbclid ?? (body.fbclid ?? null);

 const originPage = data.page ?? safePathFromReferer(referer) ?? null;
 const { first: first_name, last: last_name } = splitName(data.nome);
 const preferencia = buildPreferencia(data);

 const consentTimestamp = data.consent_timestamp ?? new Date().toISOString();
 const notesPayload = {
 consent_lgpd: data.consent_lgpd,
 consent_version: data.consent_version,
 consent_timestamp: consentTimestamp,
 email: data.email ?? null,
 page_type: data.page_type ?? null,
 page_slug: data.page_slug ?? null,
 page_intent: data.page_intent ?? null,
 page: originPage,
 page_url: data.page_url ?? null,
 utm_source,
 utm_medium,
 utm_campaign,
 utm_content,
 utm_term,
 gclid,
 fbclid,
 };

 // IMPORTANTE: o schema atual do banco (tipado em src/types/supabase.ts) usa
 // colunas em PT-BR e nao possui page_type/utm_* etc. Guardamos contexto em `notas`.
 // Assim o formulario funciona mesmo sem migrations aplicadas.
 const insertResult = await insertLeadResilient({
  nome: data.nome,
  telefone: data.telefone,
  cidade: data.cidade,
  estado: data.estado,
  email: data.email ?? null,
  sexo_preferido: data.sexo_preferido ?? null,
  cor_preferida: data.cor_preferida ?? null,
  status: "novo",
  origem: utm_source || "site_org",
  notas: JSON.stringify({
   ...notesPayload,
   referer,
   ip_address: ip,
   user_agent: req.headers.get("user-agent"),
   first_name,
   last_name,
   preferencia,
   prazo_aquisicao: data.prazo_aquisicao ?? null,
   mensagem: data.mensagem ?? null,
  }),
 });

 if (insertResult.error) {
 logger.error("Supabase error on lead insert", { error: insertResult.error });
 return NextResponse.json({ error: insertResult.error.message }, { status: 400 });
 }

 const leadId = insertResult.data?.id;
 let downloadToken: string | null = null;
 if (leadId && (data.page_slug === "guia" || data.page_type === "guia")) {
 const tokenResult = await createLeadDownloadToken(leadId, {
 version: process.env.GUIDE_CURRENT_VERSION,
 ipAddress: ip,
 userAgent: req.headers.get("user-agent"),
 });
 downloadToken = tokenResult?.token ?? null;
 }

 return NextResponse.json({ ok: true, leadId, downloadToken });
 } catch (e: unknown) {
 const errorMessage = e instanceof Error ? e.message : "Erro desconhecido";
 logger.error("Unexpected error inserting lead", { error: errorMessage });
 return NextResponse.json({ error: errorMessage }, { status: 500 });
 }
}
