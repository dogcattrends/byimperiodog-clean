import { NextResponse } from "next/server";

import { withFallbackTable, withPuppiesReadTable } from "@/lib/puppies/readTable";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type SourceParam = "legacy" | "v2" | "unified";

function parseSource(raw: string | null): SourceParam | null {
  const v = (raw ?? "").toLowerCase().trim();
  if (!v) return null;
  if (v === "legacy" || v === "puppies") return "legacy";
  if (v === "v2" || v === "puppies_v2" || v === "2") return "v2";
  if (v === "unified" || v === "view" || v === "puppies_unified") return "unified";
  return null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const source = parseSource(url.searchParams.get("source"));
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "5", 10) || 5, 1), 50);

    const s = supabaseAdmin();

    const runRead = async (query: (table: string) => Promise<any>) => {
      if (source === "legacy") {
        const res = await query("puppies");
        return Object.assign(res, { table: "puppies", usedFallback: false }) as any;
      }
      if (source === "v2") {
        return withFallbackTable({ sb: s, primary: "puppies_v2", fallback: "puppies", query });
      }
      if (source === "unified") {
        return withFallbackTable({ sb: s, primary: "puppies_unified", fallback: "puppies", query });
      }

      // default behavior: env-controlled puppies_v2 -> puppies
      return withPuppiesReadTable({ sb: s, query: (table) => query(table) });
    };

    if (id) {
      // Retorna o registro completo de um filhote específico para inspeção detalhada
      const r = await runRead((table) => (s as any).from(table).select("*").eq("id", id).single());
      if ((r as any).error) return NextResponse.json({ ok: false, error: (r as any).error.message ?? String((r as any).error) }, { status: 500 });
      return NextResponse.json({ ok: true, table: r.table, usedFallback: r.usedFallback, firstError: r.firstError, record: (r as any).data });
    }

    // Amostra recente com campos relevantes de mídia para comparação rápida
    const r = await runRead((table) => {
      const select =
        table === "puppies_v2"
          ? "id, name, status, created_at, price, gender, color, city, state, images"
          : table === "puppies_unified"
            ? "id, name, status, created_at, price_cents, gender, color, city, state, slug, images"
            : "id, nome, name, status, created_at";
      return (s as any).from(table).select(select).order("created_at", { ascending: false }).limit(limit);
    });

    if ((r as any).error) {
      return NextResponse.json({ ok: false, error: (r as any).error.message ?? String((r as any).error) }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      table: r.table,
      usedFallback: r.usedFallback,
      firstError: r.firstError,
      count: ((r as any).data?.length ?? 0) as number,
      ids: (((r as any).data ?? []) as Array<{ id: string }>).map((row) => row.id),
      sample: (r as any).data,
      note:
        "Use ?id=<uuid> para detalhar um registro específico; ?limit=N para ajustar a amostra (max 50); ?source=legacy|v2|unified para forçar a fonte.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
