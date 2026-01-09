import { randomUUID } from "crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { clearAdminSupabaseCookies, isJwtExpiredError } from "@/lib/adminSession";
import { supabaseAdminOrUser } from "@/lib/supabaseAdminOrUser";
import type { Database } from "@/types/supabase";

const DB_STATUS: Record<string, string> = {
  available: "disponivel",
  disponivel: "disponivel",
  reserved: "reservado",
  reservado: "reservado",
  sold: "vendido",
  vendido: "vendido",
};

function normalizeStatus(raw?: string | null) {
  if (!raw) return "disponivel";
  const key = raw.toLowerCase().replace(/\s+/g, "_");
  return DB_STATUS[key] ?? "disponivel";
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  let id: string | undefined;
  try {
    const body = await req.json();
    if (body && typeof body.id === "string") id = body.id;
  } catch {
    // ignore
  }

  if (!id) {
    return NextResponse.json({ error: "id obrigatorio" }, { status: 400 });
  }

  const { client: sb, mode } = supabaseAdminOrUser(req);
  if (!sb) {
    return NextResponse.json(
      { ok: false, error: mode === "missing_token" ? "Sessao admin ausente. Refaça login." : "Cliente Supabase indisponível." },
      { status: 401 },
    );
  }
  const { data: source, error } = await sb.from("puppies").select("*").eq("id", id).maybeSingle();
  if (error) {
    if (isJwtExpiredError(error)) {
      clearAdminSupabaseCookies();
      return NextResponse.json({ ok: false, error: "Sessão expirada. Refaça login." }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!source) return NextResponse.json({ error: "Filhote nao encontrado" }, { status: 404 });

  const now = new Date().toISOString();

  const payloadLegacy: Database["public"]["Tables"]["puppies"]["Insert"] = {
    id: randomUUID(),
    nome: source.nome ?? source.name ?? null,
    name: source.name ?? source.nome ?? null,
    codigo: source.codigo ? `${source.codigo}-copy` : null,
    cor: source.cor ?? source.color ?? null,
    color: source.color ?? source.cor ?? null,
    sexo: source.sexo ?? null,
    gender: source.gender ?? null,
    cidade: (source as Record<string, unknown>).cidade as string | null,
    estado: (source as Record<string, unknown>).estado as string | null,
    price_cents: source.price_cents ?? null,
    preco: source.preco ?? (source.price_cents ? source.price_cents / 100 : null),
    cover_url: source.cover_url ?? null,
    midia: source.midia ?? null,
    status: normalizeStatus(source.status),
    descricao: source.descricao ?? source.description ?? null,
    created_at: now,
    updated_at: now,
    reserved_at: null,
    sold_at: null,
  } as any;

  // Primeiro tenta duplicar no schema legado.
  const first = await sb.from("puppies").insert(payloadLegacy as any).select("id").maybeSingle();
  if (first.error && isJwtExpiredError(first.error)) {
    clearAdminSupabaseCookies();
    return NextResponse.json({ ok: false, error: "Sessão expirada. Refaça login." }, { status: 401 });
  }
  if (!first.error) {
    return NextResponse.json({ id: first.data?.id ?? (payloadLegacy as any).id });
  }

  // Fallback: schema canonical (EN). Mantém o mínimo pra criar o registro.
  const title = (source.title ?? source.name ?? source.nome ?? "Filhote") as string;
  const color = (source.color ?? source.cor ?? null) as string | null;
  const sexRaw = (source.sex ?? source.gender ?? source.sexo ?? "female") as string;
  const sex = (String(sexRaw).toLowerCase().startsWith("m") || String(sexRaw).toLowerCase() === "male") ? "male" : "female";
  const city = (source.city ?? (source as any).cidade ?? null) as string | null;
  const state = (source.state ?? (source as any).estado ?? null) as string | null;
  const mainImageUrl = (source.main_image_url ?? source.cover_url ?? source.image_url ?? null) as string | null;
  const gallery = (source.gallery ?? source.media ?? source.images ?? []) as unknown;
  const canonicalPayload: Record<string, unknown> = {
    id: randomUUID(),
    slug: (source.slug ? `${String(source.slug)}-copy` : null),
    title,
    sex,
    color,
    city,
    state,
    price_cents: source.price_cents ?? null,
    status: normalizeStatus(source.status),
    main_image_url: mainImageUrl,
    gallery,
    description: (source.description ?? source.descricao ?? null) as string | null,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const second = await sb.from("puppies").insert(canonicalPayload as any).select("id").maybeSingle();
  if (second.error) {
    if (isJwtExpiredError(second.error)) {
      clearAdminSupabaseCookies();
      return NextResponse.json({ ok: false, error: "Sessão expirada. Refaça login." }, { status: 401 });
    }
    return NextResponse.json({ error: second.error.message }, { status: 500 });
  }
  return NextResponse.json({ id: second.data?.id ?? canonicalPayload.id });
}
